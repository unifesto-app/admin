import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { logSuccess, logFailure, getClientIp, getUserAgent } from '@/lib/audit/audit-logger';

// GET /api/organizations - List all organizations with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('view_organizations', 'organizations', 'Unauthorized access attempt', {
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
      await logFailure('view_organizations', 'organizations', 'Forbidden - insufficient privileges', {
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const parentOrgId = searchParams.get('parent_org_id');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = adminClient
      .from('organizations')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'verified') {
      query = query.eq('is_verified', true);
    } else if (status === 'unverified') {
      query = query.eq('is_verified', false);
    }

    if (parentOrgId) {
      if (parentOrgId === 'null') {
        query = query.is('parent_org_id', null);
      } else {
        query = query.eq('parent_org_id', parentOrgId);
      }
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data: organizations, error, count } = await query;

    if (error) {
      await logFailure('view_organizations', 'organizations', error.message, {
        userId: user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch parent org info and counts for each organization
    const enrichedOrganizations = await Promise.all(
      (organizations || []).map(async (org) => {
        // Get parent org info
        let parent_org = null;
        if (org.parent_org_id) {
          const { data: parentData } = await adminClient
            .from('organizations')
            .select('id, name, type')
            .eq('id', org.parent_org_id)
            .single();
          parent_org = parentData;
        }

        // Get member count
        const { count: memberCount } = await adminClient
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Get sub-org count
        const { count: subOrgCount } = await adminClient
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('parent_org_id', org.id);

        return {
          ...org,
          parent_org,
          member_count: memberCount || 0,
          sub_org_count: subOrgCount || 0,
        };
      })
    );

    await logSuccess('view_organizations', 'organizations', {
      userId: user.id,
      details: { count: organizations?.length || 0, filters: { search, type, status } },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      organizations: enrichedOrganizations,
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

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('create_organization', 'organizations', 'Unauthorized access attempt', {
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
      await logFailure('create_organization', 'organizations', 'Forbidden - insufficient privileges', {
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
    const {
      name,
      slug,
      type,
      description,
      parent_org_id,
      logo_url,
      banner_url,
      website,
      email,
      phone,
      address,
      city,
      state,
      country,
      is_verified,
      is_active,
      metadata,
    } = body;

    // Validate required fields
    if (!name || !slug || !type) {
      await logFailure('create_organization', 'organizations', 'Missing required fields', {
        userId: user.id,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Name, slug, and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['university', 'college', 'club', 'community'];
    if (!validTypes.includes(type)) {
      await logFailure('create_organization', 'organizations', 'Invalid organization type', {
        userId: user.id,
        details: { type },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Invalid organization type' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      await logFailure('create_organization', 'organizations', 'Slug already exists', {
        userId: user.id,
        details: { slug },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 400 }
      );
    }

    // Create organization
    const { data: newOrg, error: createError } = await adminClient
      .from('organizations')
      .insert({
        name,
        slug,
        type,
        description: description || null,
        parent_org_id: parent_org_id || null,
        logo_url: logo_url || null,
        banner_url: banner_url || null,
        website: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || 'India',
        is_verified: is_verified || false,
        is_active: is_active !== undefined ? is_active : true,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating organization:', createError);
      await logFailure('create_organization', 'organizations', createError.message, {
        userId: user.id,
        details: { name, slug, type },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    await logSuccess('create_organization', 'organizations', {
      userId: user.id,
      resourceId: newOrg.id,
      details: { name, slug, type },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json(
      { organization: newOrg, message: 'Organization created successfully' },
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
