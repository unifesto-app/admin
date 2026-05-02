import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { logSuccess, logFailure, getClientIp, getUserAgent } from '@/lib/audit/audit-logger';

// GET /api/organizations/[id] - Get organization details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;
    const orgId = params.id;
    
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('view_organization', 'organizations', 'Unauthorized access attempt', {
        resourceId: orgId,
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
      await logFailure('view_organization', 'organizations', 'Forbidden - insufficient privileges', {
        userId: user.id,
        resourceId: orgId,
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

    // Get organization
    const { data: organization, error } = await adminClient
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error || !organization) {
      await logFailure('view_organization', 'organizations', `Organization not found: ${orgId}`, {
        userId: user.id,
        resourceId: orgId,
        details: { error: error?.message, code: error?.code },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get parent org info
    let parent_org = null;
    if (organization.parent_org_id) {
      const { data: parentData } = await adminClient
        .from('organizations')
        .select('id, name, type, slug')
        .eq('id', organization.parent_org_id)
        .single();
      parent_org = parentData;
    }

    // Get organization path (breadcrumb)
    const { data: orgPath } = await adminClient.rpc('get_organization_path', {
      org_id: orgId,
    });

    // Get member count
    const { count: memberCount } = await adminClient
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Get sub-org count
    const { count: subOrgCount } = await adminClient
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('parent_org_id', orgId);

    await logSuccess('view_organization', 'organizations', {
      userId: user.id,
      resourceId: orgId,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      organization: {
        ...organization,
        parent_org,
        org_path: orgPath || [],
        member_count: memberCount || 0,
        sub_org_count: subOrgCount || 0,
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

// PATCH /api/organizations/[id] - Update organization
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;
    const orgId = params.id;
    
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('update_organization', 'organizations', 'Unauthorized access attempt', {
        resourceId: orgId,
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
      await logFailure('update_organization', 'organizations', 'Forbidden - insufficient privileges', {
        userId: user.id,
        resourceId: orgId,
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

    // Validate type if provided
    if (type) {
      const validTypes = ['university', 'college', 'club', 'community'];
      if (!validTypes.includes(type)) {
        await logFailure('update_organization', 'organizations', 'Invalid organization type', {
          userId: user.id,
          resourceId: orgId,
          details: { type },
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
        });
        return NextResponse.json(
          { error: 'Invalid organization type' },
          { status: 400 }
        );
      }
    }

    // Check if slug already exists (if changing slug)
    if (slug) {
      const { data: existingOrg } = await adminClient
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .neq('id', orgId)
        .single();

      if (existingOrg) {
        await logFailure('update_organization', 'organizations', 'Slug already exists', {
          userId: user.id,
          resourceId: orgId,
          details: { slug },
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
        });
        return NextResponse.json(
          { error: 'Organization with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (parent_org_id !== undefined) updateData.parent_org_id = parent_org_id;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (website !== undefined) updateData.website = website;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (is_verified !== undefined) updateData.is_verified = is_verified;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (metadata !== undefined) updateData.metadata = metadata;

    // Update organization
    const { data: updatedOrg, error: updateError } = await adminClient
      .from('organizations')
      .update(updateData)
      .eq('id', orgId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      await logFailure('update_organization', 'organizations', updateError.message, {
        userId: user.id,
        resourceId: orgId,
        details: updateData,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logSuccess('update_organization', 'organizations', {
      userId: user.id,
      resourceId: orgId,
      details: updateData,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      organization: updatedOrg,
      message: 'Organization updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;
    const orgId = params.id;
    
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      await logFailure('delete_organization', 'organizations', 'Unauthorized access attempt', {
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privileges (only super_admin can delete)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      await logFailure('delete_organization', 'organizations', 'Forbidden - super admin required', {
        userId: user.id,
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Only super admins can delete organizations' },
        { status: 403 }
      );
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

    // Check if organization has sub-organizations
    const { count: subOrgCount } = await adminClient
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('parent_org_id', orgId);

    if (subOrgCount && subOrgCount > 0) {
      await logFailure('delete_organization', 'organizations', 'Cannot delete organization with sub-organizations', {
        userId: user.id,
        resourceId: orgId,
        details: { subOrgCount },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Cannot delete organization with sub-organizations. Delete or reassign them first.' },
        { status: 400 }
      );
    }

    // Delete organization
    const { error: deleteError } = await adminClient
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      await logFailure('delete_organization', 'organizations', deleteError.message, {
        userId: user.id,
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await logSuccess('delete_organization', 'organizations', {
      userId: user.id,
      resourceId: orgId,
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
