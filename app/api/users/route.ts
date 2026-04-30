import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { logSuccess, logFailure, getClientIp, getUserAgent } from '@/lib/audit/audit-logger';

// GET /api/users - List all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('view_users', 'users', 'Unauthorized access attempt', {
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      await logFailure('view_users', 'users', 'Forbidden - insufficient privileges', {
        userId: user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('is_active');
    const isBanned = searchParams.get('is_banned');
    const isVerified = searchParams.get('is_verified');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query using admin client to bypass RLS
    let query = adminClient
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (isBanned !== null && isBanned !== undefined) {
      query = query.eq('is_banned', isBanned === 'true');
    }

    if (isVerified !== null && isVerified !== undefined) {
      query = query.eq('is_verified', isVerified === 'true');
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      await logFailure('view_users', 'users', error.message, {
        userId: user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logSuccess('view_users', 'users', {
      userId: user.id,
      details: { count: users?.length || 0, filters: { search, role, isActive, isBanned, isVerified } },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('create_user', 'users', 'Unauthorized access attempt', {
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      await logFailure('create_user', 'users', 'Forbidden - insufficient privileges', {
        userId: user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = await request.json();
    const { email, password, name, username, phone, role, is_active } = body;

    // Validate required fields
    if (!email || !password) {
      await logFailure('create_user', 'users', 'Missing required fields', {
        userId: user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth using admin client
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || null,
        username: username || null,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      await logFailure('create_user', 'users', createError.message, {
        userId: user.id,
        details: { email, name, username },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Update profile with additional fields using admin client
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({
        name: name || null,
        username: username || null,
        email: email,
        phone: phone || null,
        role: role || 'attendee',
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq('id', newUser.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      await logFailure('create_user', 'users', updateError.message, {
        userId: user.id,
        resourceId: newUser.user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logSuccess('create_user', 'users', {
      userId: user.id,
      resourceId: newUser.user.id,
      details: { email, name, username, role: role || 'attendee' },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json(
      { user: updatedProfile, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
