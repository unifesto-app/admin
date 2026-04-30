import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const ADMIN_ROLES = new Set(['super_admin', 'admin']);
const DEFAULT_ADMIN_EMAIL = 'unifestoapp@gmail.com';
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;
const LOGIN_RATE_LIMIT_MAX_REQUESTS = 40;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

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

const isAdminRole = (role: unknown): role is string => {
  return typeof role === 'string' && ADMIN_ROLES.has(role);
};

const getPrivilegedEmails = () => {
  const raw = process.env.ADMIN_PRIVILEGED_EMAILS ?? DEFAULT_ADMIN_EMAIL;
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Rate limiting for auth routes
  if (pathname === '/login' || pathname === '/auth/callback') {
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

  // Check Supabase configuration
  if (!supabaseUrl || !supabaseKey) {
    if (pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      loginUrl.searchParams.set('error', 'supabase-config-missing');
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let isActive: boolean = true;
  let isBanned: boolean = false;
  
  if (user) {
    let profileById: { role?: string; is_active?: boolean; is_banned?: boolean } | null = null;
    let profileByEmail: { role?: string; is_active?: boolean; is_banned?: boolean } | null = null;

    if (serviceRoleKey) {
      const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: byId } = await adminClient
        .from('profiles')
        .select('role,is_active,is_banned')
        .eq('id', user.id)
        .maybeSingle();

      profileById = byId ?? null;

      if (!profileById?.role && user.email) {
        const { data: byEmail } = await adminClient
          .from('profiles')
          .select('role,is_active,is_banned')
          .ilike('email', user.email)
          .maybeSingle();

        profileByEmail = byEmail ?? null;
      }
    } else {
      const { data: byId } = await supabase
        .from('profiles')
        .select('role,is_active,is_banned')
        .eq('id', user.id)
        .maybeSingle();

      profileById = byId ?? null;

      if (!profileById?.role && user.email) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('role,is_active,is_banned')
          .ilike('email', user.email)
          .maybeSingle();

        profileByEmail = byEmail ?? null;
      }
    }

    role = profileById?.role ?? null;
    isActive = profileById?.is_active ?? true;
    isBanned = profileById?.is_banned ?? false;
    role = role ?? profileByEmail?.role ?? null;
    isActive = isActive ?? profileByEmail?.is_active ?? true;
    isBanned = isBanned ?? profileByEmail?.is_banned ?? false;
  }

  const isAuthenticated = Boolean(user);
  const privilegedEmails = getPrivilegedEmails();
  const isPrivilegedEmail = Boolean(user?.email && privilegedEmails.has(user.email.toLowerCase()));
  const isActiveProfile = isActive && !isBanned;
  const isAuthorizedAdmin = (isAdminRole(role) && isActiveProfile) || isPrivilegedEmail;

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
  matcher: ['/dashboard/:path*', '/login', '/auth/callback'],
};
