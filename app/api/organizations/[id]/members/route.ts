import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { logSuccess, logFailure, getClientIp, getUserAgent } from '@/lib/audit/audit-logger';

// GET /api/organizations/[id]/members - Get organization members
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
      await logFailure('view_organization_members', 'organization_members', 'Unauthorized access attempt', {
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
      await logFailure('view_organization_members', 'organization_members', 'Forbidden - insufficient privileges', {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') || '';

    // Get members
    let query = adminClient
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId);

    if (role) {
      query = query.eq('role', role);
    }

    query = query.order('joined_at', { ascending: false });

    const { data: members, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      await logFailure('view_organization_members', 'organization_members', error.message, {
        userId: user.id,
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch profile data for each member
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        const { data: profileData } = await adminClient
          .from('profiles')
          .select('id, name, email, username, avatar_url')
          .eq('id', member.user_id)
          .single();

        return {
          ...member,
          profile: profileData || null,
        };
      })
    );

    await logSuccess('view_organization_members', 'organization_members', {
      userId: user.id,
      resourceId: orgId,
      details: { count: members?.length || 0 },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      members: enrichedMembers,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/members - Add member to organization
export async function POST(
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
      await logFailure('add_organization_member', 'organization_members', 'Unauthorized access attempt', {
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
      await logFailure('add_organization_member', 'organization_members', 'Forbidden - insufficient privileges', {
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
    const { user_id, role, permissions } = body;

    // Validate required fields
    if (!user_id || !role) {
      await logFailure('add_organization_member', 'organization_members', 'Missing required fields', {
        userId: user.id,
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'organizer', 'member'];
    if (!validRoles.includes(role)) {
      await logFailure('add_organization_member', 'organization_members', 'Invalid role', {
        userId: user.id,
        resourceId: orgId,
        details: { role },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (!userProfile) {
      await logFailure('add_organization_member', 'organization_members', 'User not found', {
        userId: user.id,
        resourceId: orgId,
        details: { user_id },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if member already exists
    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user_id)
      .single();

    if (existingMember) {
      await logFailure('add_organization_member', 'organization_members', 'User is already a member', {
        userId: user.id,
        resourceId: orgId,
        details: { user_id },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Add member
    const { data: newMember, error: createError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: orgId,
        user_id,
        role,
        permissions: permissions || {},
      })
      .select()
      .single();

    if (createError) {
      console.error('Error adding member:', createError);
      await logFailure('add_organization_member', 'organization_members', createError.message, {
        userId: user.id,
        resourceId: orgId,
        details: { user_id, role },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    await logSuccess('add_organization_member', 'organization_members', {
      userId: user.id,
      resourceId: orgId,
      details: { user_id, role },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json(
      { member: newMember, message: 'Member added successfully' },
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

// PATCH /api/organizations/[id]/members - Update member role
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
      await logFailure('update_organization_member', 'organization_members', 'Unauthorized access attempt', {
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
      await logFailure('update_organization_member', 'organization_members', 'Forbidden - insufficient privileges', {
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
    const { member_id, role, permissions } = body;

    // Validate required fields
    if (!member_id) {
      await logFailure('update_organization_member', 'organization_members', 'Missing member ID', {
        userId: user.id,
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['owner', 'admin', 'organizer', 'member'];
      if (!validRoles.includes(role)) {
        await logFailure('update_organization_member', 'organization_members', 'Invalid role', {
          userId: user.id,
          resourceId: orgId,
          details: { role },
          ipAddress: getClientIp(request.headers),
          userAgent: getUserAgent(request.headers),
        });
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;

    // Update member
    const { data: updatedMember, error: updateError } = await adminClient
      .from('organization_members')
      .update(updateData)
      .eq('id', member_id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating member:', updateError);
      await logFailure('update_organization_member', 'organization_members', updateError.message, {
        userId: user.id,
        resourceId: orgId,
        details: { member_id, ...updateData },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logSuccess('update_organization_member', 'organization_members', {
      userId: user.id,
      resourceId: orgId,
      details: { member_id, ...updateData },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      member: updatedMember,
      message: 'Member updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/members - Remove member from organization
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
      await logFailure('remove_organization_member', 'organization_members', 'Unauthorized access attempt', {
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
      await logFailure('remove_organization_member', 'organization_members', 'Forbidden - insufficient privileges', {
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

    const searchParams = request.nextUrl.searchParams;
    const member_id = searchParams.get('member_id');

    if (!member_id) {
      await logFailure('remove_organization_member', 'organization_members', 'Missing member ID', {
        userId: user.id,
        resourceId: orgId,
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Delete member
    const { error: deleteError } = await adminClient
      .from('organization_members')
      .delete()
      .eq('id', member_id)
      .eq('organization_id', orgId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      await logFailure('remove_organization_member', 'organization_members', deleteError.message, {
        userId: user.id,
        resourceId: orgId,
        details: { member_id },
        ipAddress: getClientIp(request.headers),
        userAgent: getUserAgent(request.headers),
      });
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await logSuccess('remove_organization_member', 'organization_members', {
      userId: user.id,
      resourceId: orgId,
      details: { member_id },
      ipAddress: getClientIp(request.headers),
      userAgent: getUserAgent(request.headers),
    });

    return NextResponse.json({
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
