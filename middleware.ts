import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ADMIN_ROLES = new Set(['super_admin', 'admin']);
const DEFAULT_ADMIN_EMAIL = 'unifestoapp@gmail.com';

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

  if (!supabaseUrl || !supabaseKey) {
    if (pathname.startsWith('/super-admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      loginUrl.searchParams.set('error', 'supabase-config-missing');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
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
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  const isAuthenticated = Boolean(user);
  const privilegedEmails = getPrivilegedEmails();
  const isPrivilegedEmail = Boolean(user?.email && privilegedEmails.has(user.email.toLowerCase()));
  const isAuthorizedAdmin = isAdminRole(role) || isPrivilegedEmail;

  if (pathname.startsWith('/super-admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAuthorizedAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname === '/login' && isAuthenticated && isAuthorizedAdmin) {
    return NextResponse.redirect(new URL('/super-admin', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/super-admin/:path*', '/login', '/auth/callback'],
};
