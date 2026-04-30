import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/users/bulk - Bulk operations on users
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, userIds, reason } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and userIds array are required' },
        { status: 400 }
      );
    }

    // Prevent operations on self
    if (userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk operations on your own account' },
        { status: 400 }
      );
    }

    let result;
    let message;

    switch (action) {
      case 'activate':
        result = await supabase
          .from('profiles')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in('id', userIds);
        message = `${userIds.length} user(s) activated successfully`;
        break;

      case 'deactivate':
        result = await supabase
          .from('profiles')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', userIds);
        message = `${userIds.length} user(s) deactivated successfully`;
        break;

      case 'ban':
        result = await supabase
          .from('profiles')
          .update({ 
            is_banned: true, 
            ban_reason: reason || 'No reason provided',
            updated_at: new Date().toISOString() 
          })
          .in('id', userIds);
        message = `${userIds.length} user(s) banned successfully`;
        break;

      case 'unban':
        result = await supabase
          .from('profiles')
          .update({ 
            is_banned: false, 
            ban_reason: null,
            updated_at: new Date().toISOString() 
          })
          .in('id', userIds);
        message = `${userIds.length} user(s) unbanned successfully`;
        break;

      case 'verify':
        result = await supabase
          .from('profiles')
          .update({ is_verified: true, updated_at: new Date().toISOString() })
          .in('id', userIds);
        message = `${userIds.length} user(s) verified successfully`;
        break;

      case 'delete':
        // Only super_admin can delete users
        if (profile.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Forbidden - Only super admins can delete users' },
            { status: 403 }
          );
        }

        // Delete users one by one (Supabase doesn't support bulk delete in auth)
        const deletePromises = userIds.map((id) =>
          supabase.auth.admin.deleteUser(id)
        );
        await Promise.all(deletePromises);
        message = `${userIds.length} user(s) deleted successfully`;
        result = { error: null };
        break;

      case 'promote_to_organizer':
        result = await supabase
          .from('profiles')
          .update({ role: 'organizer', updated_at: new Date().toISOString() })
          .in('id', userIds);
        message = `${userIds.length} user(s) promoted to organizer successfully`;
        break;

      case 'promote_to_admin':
        // Only super_admin can promote users
        if (profile.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Forbidden - Only super admins can promote users to admin' },
            { status: 403 }
          );
        }
        result = await supabase
          .from('profiles')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .in('id', userIds);
        message = `${userIds.length} user(s) promoted to admin successfully`;
        break;

      case 'demote_to_attendee':
        result = await supabase
          .from('profiles')
          .update({ role: 'attendee', updated_at: new Date().toISOString() })
          .in('id', userIds);
        message = `${userIds.length} user(s) demoted to attendee successfully`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: activate, deactivate, ban, unban, verify, delete, promote_to_organizer, promote_to_admin, demote_to_attendee' },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error('Error performing bulk operation:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({
      message,
      affectedCount: userIds.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
