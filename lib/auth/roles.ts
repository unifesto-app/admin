/**
 * Admin role utilities for authorization checks
 */

export const ADMIN_ROLES = ['org_admin', 'org_super_admin', 'super_admin'] as const;
export const ADMIN_ROLE_CODES = ['ORG_ADMIN', 'ORG_OWNER', 'SUPER_ADMIN', 'PLATFORM_ADMIN'] as const;
export const SUPER_ADMIN_ROLE = 'super_admin' as const;

export type AdminRole = typeof ADMIN_ROLES[number];
export type SuperAdminRole = typeof SUPER_ADMIN_ROLE;

/**
 * Check if a role is an admin role (org_admin, org_super_admin, or super_admin)
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Check if user has any admin role (works with role arrays from new system)
 */
export function hasAdminRole(roles: string | string[] | null | undefined): boolean {
  if (!roles) return false;
  
  // Handle single role (backward compatibility)
  if (typeof roles === 'string') {
    return isAdminRole(roles);
  }
  
  // Handle array of roles (new system)
  if (Array.isArray(roles)) {
    // Check if any role in the array is an admin role
    return roles.some(role => 
      ADMIN_ROLES.includes(role as AdminRole) || 
      ADMIN_ROLE_CODES.includes(role as any)
    );
  }
  
  return false;
}

/**
 * Check if a role is super_admin
 */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN_ROLE;
}

/**
 * Check if user has super admin role (works with role arrays)
 */
export function hasSuperAdminRole(roles: string | string[] | null | undefined): boolean {
  if (!roles) return false;
  
  if (typeof roles === 'string') {
    return isSuperAdminRole(roles);
  }
  
  if (Array.isArray(roles)) {
    return roles.some(role => 
      role === 'super_admin' || 
      role === 'SUPER_ADMIN' || 
      role === 'PLATFORM_ADMIN'
    );
  }
  
  return false;
}

/**
 * Check if a role is org_super_admin or super_admin
 */
export function isOrgSuperAdminOrHigher(role: string | null | undefined): boolean {
  return role === 'org_super_admin' || role === 'super_admin';
}

/**
 * Check if user has org super admin or higher (works with role arrays)
 */
export function hasOrgSuperAdminOrHigher(roles: string | string[] | null | undefined): boolean {
  if (!roles) return false;
  
  if (typeof roles === 'string') {
    return isOrgSuperAdminOrHigher(roles);
  }
  
  if (Array.isArray(roles)) {
    return roles.some(role => 
      role === 'org_super_admin' || 
      role === 'super_admin' ||
      role === 'ORG_SUPER_ADMIN' ||
      role === 'SUPER_ADMIN' ||
      role === 'PLATFORM_ADMIN'
    );
  }
  
  return false;
}
