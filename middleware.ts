import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;
const LOGIN_RATE_LIMIT_MAX_REQUESTS = 40;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Session cache configuration
const SESSION_CACHE_TTL_MS = 30_000; // 30 seconds cache
const SESSION_CACHE_MAX_SIZE = 1000; // Maximum number of cached sessions

// Admin role codes from the new system
const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'ORG_SUPER_ADMIN', 'ORG_ADMIN']);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

type SessionCacheEntry = {
  data: { user: any; roles: any[] };
  expiresAt: number;
};

type SessionCacheStore = Map<string, SessionCacheEntry>;

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), usb=()',
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
};

const getRateLimitStore = (): RateLimitStore => {
  const globalRateStore = globalThis as typeof globalThis & {
    __ufAdminRateStore?: RateLimitStore;
  };

  if (!globalRateStore.__ufAdminRateStore) {
    globalRateStore.__ufAdminRateStore = new Map<string, RateLimitEntry>();
  }

  return globalRateStore.__ufAdminRateStore;
};

const getSessionCacheStore = (): SessionCacheStore => {
  const globalSessionCache = globalThis as typeof globalThis & {
    __ufAdminSessionCache?: SessionCacheStore;
  };

  if (!globalSessionCache.__ufAdminSessionCache) {
    globalSessionCache.__ufAdminSessionCache = new Map<string, SessionCacheEntry>();
  }

  return globalSessionCache.__ufAdminSessionCache;
};

const cleanExpiredSessions = () => {
  const now = Date.now();
  const cache = getSessionCacheStore();
  
  // Clean expired entries
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
  
  // Limit cache size (LRU-style: remove oldest if too large)
  if (cache.size > SESSION_CACHE_MAX_SIZE) {
    const entriesToRemove = cache.size - SESSION_CACHE_MAX_SIZE;
    const keys = Array.from(cache.keys());
    for (let i = 0; i < entriesToRemove; i++) {
      cache.delete(keys[i]);
    }
  }
};

const getCachedSession = (token: string): { user: any; roles: any[] } | null => {
  const cache = getSessionCacheStore();
  const entry = cache.get(token);
  
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(token);
    return null;
  }
  
  return entry.data;
};

const setCachedSession = (token: string, data: { user: any; roles: any[] }) => {
  cleanExpiredSessions();
  const cache = getSessionCacheStore();
  cache.set(token, {
    data,
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
  });
};

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
};

const isRateLimited = (key: string) => {
  const now = Date.now();
  const store = getRateLimitStore();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  existing.count += 1;
  store.set(key, existing);
  return existing.count > LOGIN_RATE_LIMIT_MAX_REQUESTS;
};

const getAllowedIps = () => {
  const raw = process.env.ADMIN_ALLOWED_IPS ?? '';
  return new Set(
    raw
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean)
  );
};

const isAllowedIp = (request: NextRequest) => {
  const allowList = getAllowedIps();
  if (allowList.size === 0) return true;
  return allowList.has(getClientIp(request));
};

const withSecurityHeaders = (response: NextResponse) => {
  Object.entries(securityHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};

const getTokenFromCookies = (request: NextRequest): string | null => {
  return request.cookies.get('unifesto_admin_token')?.value || null;
};

async function validateSession(token: string): Promise<{ user: any; roles: any[] } | null> {
  // Check cache first
  const cached = getCachedSession(token);
  if (cached) {
    return cached;
  }

  try {
    // Validate token with backend
    const sessionResponse = await axios.get(`${BACKEND_URL}/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    if (!sessionResponse.data?.user) {
      return null;
    }

    const user = sessionResponse.data.user;

    // Get user roles
    const rolesResponse = await axios.get(`${BACKEND_URL}/roles/users/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    const roles = rolesResponse.data || [];
    const sessionData = { user, roles };

    // Cache the session
    setCachedSession(token, sessionData);

    return sessionData;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

function hasAdminRole(roles: any[]): boolean {
  return roles.some((userRole) => {
    const roleCode = userRole.role?.code || userRole.roleCode;
    return ADMIN_ROLES.has(roleCode);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Rate limiting for auth routes
  if (pathname === '/login' || pathname.startsWith('/auth/')) {
    const clientIp = getClientIp(request);
    const limited = isRateLimited(`${pathname}:${clientIp}`);
    if (limited) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Too many authentication attempts. Please try again in a minute.' },
          { status: 429 }
        )
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Get token from cookies
  const token = getTokenFromCookies(request);
  
  let sessionData: { user: any; roles: any[] } | null = null;
  let isAuthenticated = false;
  let isAuthorizedAdmin = false;

  if (token) {
    sessionData = await validateSession(token);
    isAuthenticated = !!sessionData;
    isAuthorizedAdmin = sessionData ? hasAdminRole(sessionData.roles) : false;
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAllowedIp(request)) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/unauthorized?reason=ip-restricted', request.url)));
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (!isAuthorizedAdmin) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/unauthorized', request.url)));
    }
  }

  // Redirect authenticated admins away from login
  if (pathname === '/login' && isAuthenticated && isAuthorizedAdmin) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/auth/:path*'],
};
