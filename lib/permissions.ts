/**
 * Admin Permissions System
 * Granular access control for admin dashboard
 */

// Permission categories and actions
export const PERMISSIONS = {
  // Admin access
  ADMIN_ACCESS: 'admin.access',

  // User management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Event management
  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_EDIT: 'events.edit',
  EVENTS_DELETE: 'events.delete',

  // Organization management
  ORGS_VIEW: 'organizations.view',
  ORGS_CREATE: 'organizations.create',
  ORGS_EDIT: 'organizations.edit',
  ORGS_DELETE: 'organizations.delete',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',

  // Transactions
  TRANSACTIONS_VIEW: 'transactions.view',
  TRANSACTIONS_MANAGE: 'transactions.manage',

  // Invoices
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_EDIT: 'invoices.edit',

  // Payouts
  PAYOUTS_VIEW: 'payouts.view',
  PAYOUTS_CREATE: 'payouts.create',
  PAYOUTS_APPROVE: 'payouts.approve',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  // Audit logs
  AUDIT_LOGS_VIEW: 'audit_logs.view',

  // Roles & permissions
  ROLES_VIEW: 'roles.view',
  ROLES_EDIT: 'roles.edit',
  PERMISSIONS_MANAGE: 'permissions.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Admin roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
  ANALYST: 'analyst',
  FINANCE: 'finance',
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

// Role definitions with their permissions
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_CREATE,
    PERMISSIONS.EVENTS_EDIT,
    PERMISSIONS.ORGS_VIEW,
    PERMISSIONS.ORGS_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],
  moderator: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.EVENTS_EDIT,
    PERMISSIONS.ORGS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  support: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.ORGS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
  ],
  analyst: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
  ],
  finance: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_MANAGE,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_EDIT,
    PERMISSIONS.PAYOUTS_VIEW,
    PERMISSIONS.PAYOUTS_CREATE,
    PERMISSIONS.PAYOUTS_APPROVE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

// Route permissions mapping
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/super-admin': [PERMISSIONS.ADMIN_ACCESS],
  '/super-admin/users': [PERMISSIONS.USERS_VIEW],
  '/super-admin/events': [PERMISSIONS.EVENTS_VIEW],
  '/super-admin/organizations': [PERMISSIONS.ORGS_VIEW],
  '/super-admin/analytics': [PERMISSIONS.ANALYTICS_VIEW],
  '/super-admin/transactions': [PERMISSIONS.TRANSACTIONS_VIEW],
  '/super-admin/invoices': [PERMISSIONS.INVOICES_VIEW],
  '/super-admin/payouts': [PERMISSIONS.PAYOUTS_VIEW],
  '/super-admin/settings': [PERMISSIONS.SETTINGS_VIEW],
  '/super-admin/audit-logs': [PERMISSIONS.AUDIT_LOGS_VIEW],
  '/super-admin/roles': [PERMISSIONS.ROLES_VIEW],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(
  userPermissions: Permission[],
  route: string
): boolean {
  const requiredPermissions = ROUTE_PERMISSIONS[route];
  if (!requiredPermissions) return true; // No permissions required
  return hasAllPermissions(userPermissions, requiredPermissions);
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRole: string): boolean {
  return userRole === ADMIN_ROLES.SUPER_ADMIN;
}

/**
 * Filter routes based on user permissions
 */
export function getAccessibleRoutes(
  userPermissions: Permission[]
): string[] {
  return Object.keys(ROUTE_PERMISSIONS).filter((route) =>
    canAccessRoute(userPermissions, route)
  );
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: Permission): string {
  const names: Record<Permission, string> = {
    'admin.access': 'Admin Access',
    'users.view': 'View Users',
    'users.create': 'Create Users',
    'users.edit': 'Edit Users',
    'users.delete': 'Delete Users',
    'events.view': 'View Events',
    'events.create': 'Create Events',
    'events.edit': 'Edit Events',
    'events.delete': 'Delete Events',
    'organizations.view': 'View Organizations',
    'organizations.create': 'Create Organizations',
    'organizations.edit': 'Edit Organizations',
    'organizations.delete': 'Delete Organizations',
    'analytics.view': 'View Analytics',
    'transactions.view': 'View Transactions',
    'transactions.manage': 'Manage Transactions',
    'invoices.view': 'View Invoices',
    'invoices.create': 'Create Invoices',
    'invoices.edit': 'Edit Invoices',
    'payouts.view': 'View Payouts',
    'payouts.create': 'Create Payouts',
    'payouts.approve': 'Approve Payouts',
    'settings.view': 'View Settings',
    'settings.edit': 'Edit Settings',
    'audit_logs.view': 'View Audit Logs',
    'roles.view': 'View Roles',
    'roles.edit': 'Edit Roles',
    'permissions.manage': 'Manage Permissions',
  };
  return names[permission] || permission;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    moderator: 'Moderator',
    support: 'Support Staff',
    analyst: 'Data Analyst',
    finance: 'Finance Manager',
  };
  return names[role] || role;
}
