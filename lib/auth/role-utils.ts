import { createClient } from '@/lib/supabase/server';

/**
 * Role utility functions for the new access_roles system
 * These replace the old profiles.role column which no longer exists
 */

export interface UserRole {
  role_id: string;
  role_code: string;
  role_name: string;
  role_scope: string;
  resource_id?: string;
  resource_type?: string;
}

/**
 * Get all active roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_access')
    .select(
      `
      id,
      role_id,
      role_scope,
      resource_id,
      resource_type,
      access_roles!inner(
        id,
        code,
        name,
        scope
      )
    `
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (error) {
    console.error('Error getting user roles:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    role_id: item.role_id,
    role_code: item.access_roles.code,
    role_name: item.access_roles.name,
    role_scope: item.access_roles.scope,
    resource_id: item.resource_id,
    resource_type: item.resource_type,
  }));
}

/**
 * Check if user has a specific role by code
 */
export async function userHasRole(
  userId: string,
  roleCode: string
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('user_has_role', {
    p_user_id: userId,
    p_role_code: roleCode,
  });

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return data === true;
}

/**
 * Get user's highest priority role
 */
export async function getUserHighestRole(
  userId: string
): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_user_highest_role', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error getting user highest role:', error);
    return null;
  }

  return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
}

/**
 * Check if user is super admin (has SUPER_ADMIN or PLATFORM_ADMIN role)
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const hasSuperAdmin = await userHasRole(userId, 'SUPER_ADMIN');
  if (hasSuperAdmin) return true;

  const hasPlatformAdmin = await userHasRole(userId, 'PLATFORM_ADMIN');
  return hasPlatformAdmin;
}

/**
 * Check if user is org owner
 */
export async function isOrgOwner(
  userId: string,
  orgId?: string
): Promise<boolean> {
  const roles = await getUserRoles(userId);

  if (!orgId) {
    // Check if user has ORG_SUPER_ADMIN role anywhere
    return roles.some((r) => r.role_code === 'ORG_SUPER_ADMIN');
  }

  // Check if user has ORG_SUPER_ADMIN role for specific org
  return roles.some(
    (r) =>
      r.role_code === 'ORG_SUPER_ADMIN' &&
      r.resource_type === 'organization' &&
      r.resource_id === orgId
  );
}

/**
 * Check if user is org admin
 */
export async function isOrgAdmin(
  userId: string,
  orgId?: string
): Promise<boolean> {
  const roles = await getUserRoles(userId);

  if (!orgId) {
    // Check if user has ORG_ADMIN role anywhere
    return roles.some((r) => r.role_code === 'ORG_ADMIN');
  }

  // Check if user has ORG_ADMIN role for specific org
  return roles.some(
    (r) =>
      r.role_code === 'ORG_ADMIN' &&
      r.resource_type === 'organization' &&
      r.resource_id === orgId
  );
}

/**
 * Check if user has admin privileges (super admin, org owner, or org admin)
 */
export async function isAdminRole(userId: string): Promise<boolean> {
  // Check if super admin
  if (await isSuperAdmin(userId)) {
    return true;
  }

  // Check if has any org owner or admin role
  const roles = await getUserRoles(userId);
  return roles.some(
    (r) => r.role_code === 'ORG_SUPER_ADMIN' || r.role_code === 'ORG_ADMIN'
  );
}

/**
 * Check if user has super admin privileges
 */
export async function isSuperAdminRole(userId: string): Promise<boolean> {
  return isSuperAdmin(userId);
}

/**
 * Get user's legacy role for backward compatibility
 * Maps new access_roles to old platform_role enum values
 */
export async function getUserLegacyRole(userId: string): Promise<string> {
  const highestRole = await getUserHighestRole(userId);

  if (!highestRole) {
    return 'attendee';
  }

  // Map new role codes to old platform_role values
  const roleMapping: Record<string, string> = {
    SUPER_ADMIN: 'super_admin',
    PLATFORM_ADMIN: 'super_admin',
    ORG_OWNER: 'org_super_admin',
    ORG_ADMIN: 'org_admin',
    ORG_ORGANIZER: 'organizer',
    EVENT_ORGANIZER: 'organizer',
    USER: 'attendee',
  };

  return roleMapping[highestRole.role_code] || 'attendee';
}
