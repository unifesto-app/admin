import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// GET /api/organizations/test - Test endpoint to verify service role access
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Test 1: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlValue: supabaseUrl,
      keyPrefix: serviceRoleKey?.substring(0, 20),
    };

    // Test 2: Try to connect with service role
    const adminClient = createServiceClient(supabaseUrl!, serviceRoleKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test 3: Try to fetch organizations
    const { data: orgs, error: orgsError, count } = await adminClient
      .from('organizations')
      .select('*', { count: 'exact' })
      .limit(5);

    // Test 4: Try to fetch a specific organization by ID
    let specificOrgTest = null;
    if (orgs && orgs.length > 0) {
      const testId = orgs[0].id;
      const { data: specificOrg, error: specificError } = await adminClient
        .from('organizations')
        .select('*')
        .eq('id', testId)
        .single();

      specificOrgTest = {
        testId,
        found: !!specificOrg,
        error: specificError?.message,
        code: specificError?.code,
      };
    }

    // Test 5: Check RLS status
    const { data: rlsStatus } = await adminClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'organizations')
      .single();

    return NextResponse.json({
      success: true,
      tests: {
        environment: envCheck,
        organizationsQuery: {
          success: !orgsError,
          count: count,
          sampleCount: orgs?.length || 0,
          sampleIds: orgs?.map(o => ({ id: o.id, name: o.name })) || [],
          error: orgsError?.message,
          code: orgsError?.code,
        },
        specificOrgQuery: specificOrgTest,
        rlsStatus: rlsStatus,
      },
      userInfo: {
        userId: user.id,
        userRole: profile.role,
      },
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
