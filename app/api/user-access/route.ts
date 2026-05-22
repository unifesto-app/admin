import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isAdminRole } from '@/lib/auth/role-utils';

// GET /api/user-access - Get all user access records
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges
    const hasAdminAccess = await isAdminRole(user.id);
    if (!hasAdminAccess) {
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

    // Get user access records with related data
    const { data: userAccess, error } = await adminClient
      .from('user_access')
      .select(`
        *,
        access_roles!inner(id, name, code, scope),
        profiles!inner(id, name, email, username)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user access:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with organization and event names
    const enrichedAccess = await Promise.all(
      (userAccess || []).map(async (access: any) => {
        let organization = null;
        let event = null;

        if (access.organization_id) {
          const { data: org } = await adminClient
            .from('organizations')
            .select('id, name')
            .eq('id', access.organization_id)
            .single();
          organization = org;
        }

        if (access.event_id) {
          const { data: evt } = await adminClient
            .from('events')
            .select('id, name')
            .eq('id', access.event_id)
            .single();
          event = evt;
        }

        return {
          id: access.id,
          user_id: access.user_id,
          role_id: access.role_id,
          role_scope: access.role_scope,
          organization_id: access.organization_id,
          event_id: access.event_id,
          status: access.status,
          created_at: access.created_at,
          user: {
            id: access.profiles.id,
            name: access.profiles.name,
            email: access.profiles.email,
            username: access.profiles.username,
          },
          role: {
            id: access.access_roles.id,
            name: access.access_roles.name,
            code: access.access_roles.code,
            scope: access.access_roles.scope,
          },
          organization,
          event,
        };
      })
    );

    return NextResponse.json({ access: enrichedAccess });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
