import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

type LoginBody = {
  email?: string;
  password?: string;
};

/**
 * POST /api/auth/login
 * Handles email/password login via Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
    const isActive = !profile?.status || profile.status === 'active';

    // Check privileged emails
    const privilegedEmails = (process.env.ADMIN_PRIVILEGED_EMAILS || 'unifestoapp@gmail.com')
      .split(',')
      .map(e => e.trim().toLowerCase());
    const isPrivileged = email && privilegedEmails.includes(email.toLowerCase());

    if (!isPrivileged && (!isAdmin || !isActive)) {
      // Sign out the user since they don't have admin access
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'You do not have admin privileges' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile?.role || 'privileged',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
