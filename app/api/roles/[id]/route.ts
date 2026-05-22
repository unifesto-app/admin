import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { logSuccess, logFailure, getClientIp, getUserAgent } from '@/lib/audit/audit-logger';
import { isAdminRole as checkIsAdminRole } from '@/lib/auth/role-utils';

// Helper to check admin privileges
async function checkAdminPrivileges(user: any) {
  const hasAdminAccess = await checkIsAdminRole(user.id);
  return { isAuthorized: hasAdminAccess, profile: null };
}

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isAuthorized } = await checkAdminPrivileges(user);
    if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: role, error } = await adminClient
      .from('access_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    return NextResponse.json({ role });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isAuthorized } = await checkAdminPrivileges(user);
    if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, code, scope, description } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: existingRole } = await adminClient
      .from('access_roles')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existingRole?.is_system) {
      return NextResponse.json({ error: 'Cannot update system roles' }, { status: 400 });
    }

    const { data: role, error } = await adminClient
      .from('access_roles')
      .update({
        name,
        code,
        scope,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logSuccess('update_role', 'access_roles', {
      resourceId: id,
      userId: user.id,
      details: { name, code, scope },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({ role });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete a role (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isAuthorized } = await checkAdminPrivileges(user);
    if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: existingRole } = await adminClient
      .from('access_roles')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existingRole?.is_system) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('access_roles')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logSuccess('delete_role', 'access_roles', {
      resourceId: id,
      userId: user.id,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/roles/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
