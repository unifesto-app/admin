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
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  if (!supabaseUrl || !supabaseKey) {
    if (pathname.startsWith('/super-admin')) {
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
  let profileStatus: string | null = null;
  if (user) {
    let profileById: { role?: string; status?: string } | null = null;
    let profileByEmail: { role?: string; status?: string } | null = null;

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
        .select('role,status')
        .eq('id', user.id)
        .maybeSingle();

      profileById = byId ?? null;

      if (!profileById?.role && user.email) {
        const { data: byEmail } = await adminClient
          .from('profiles')
          .select('role,status')
          .ilike('email', user.email)
          .maybeSingle();

        profileByEmail = byEmail ?? null;
      }
    } else {
      const { data: byId } = await supabase
        .from('profiles')
        .select('role,status')
        .eq('id', user.id)
        .maybeSingle();

      profileById = byId ?? null;

      if (!profileById?.role && user.email) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('role,status')
          .ilike('email', user.email)
          .maybeSingle();

        profileByEmail = byEmail ?? null;
      }
    }

    role = profileById?.role ?? null;
    profileStatus = profileById?.status ?? null;
    role = role ?? profileByEmail?.role ?? null;
    profileStatus = profileStatus ?? profileByEmail?.status ?? null;
  }

  const isAuthenticated = Boolean(user);
  const privilegedEmails = getPrivilegedEmails();
  const isPrivilegedEmail = Boolean(user?.email && privilegedEmails.has(user.email.toLowerCase()));
  const isActiveProfile = !profileStatus || profileStatus === 'active';
  const isAuthorizedAdmin = (isAdminRole(role) && isActiveProfile) || isPrivilegedEmail;

  if (pathname.startsWith('/super-admin')) {
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

  if (pathname === '/login' && isAuthenticated && isAuthorizedAdmin) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/super-admin', request.url)));
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: ['/super-admin/:path*', '/login', '/auth/callback'],
};
