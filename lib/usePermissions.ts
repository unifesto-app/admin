/**
 * React Hook for Admin Permissions
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Permission,
  AdminRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  getRolePermissions,
  isSuperAdmin,
} from './permissions';

interface UserPermissions {
  role: string;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get user permissions
 */
export function usePermissions(): UserPermissions {
  const [role, setRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('Not authenticated');
          setIsLoading(false);
          return;
        }

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError('Failed to load profile');
          setIsLoading(false);
          return;
        }

        const userRole = profile?.role || 'attendee';
        setRole(userRole);

        // If super admin, grant all permissions
        if (isSuperAdmin(userRole)) {
          setPermissions(getRolePermissions('super_admin'));
          setIsLoading(false);
          return;
        }

        // Get role-based permissions
        const rolePermissions = getRolePermissions(userRole as AdminRole);

        // Get additional direct permissions from admin_permissions table
        const { data: directPermissions } = await supabase
          .from('admin_permissions')
          .select('permission')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

        const allPermissions = [
          ...rolePermissions,
          ...(directPermissions?.map((p) => p.permission as Permission) || []),
        ];

        // Remove duplicates
        const uniquePermissions = Array.from(new Set(allPermissions));

        setPermissions(uniquePermissions);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
        setIsLoading(false);
      }
    }

    loadPermissions();
  }, []);

  return { role, permissions, isLoading, error };
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(requiredPermission: Permission): boolean {
  const { permissions } = usePermissions();
  return hasPermission(permissions, requiredPermission);
}

/**
 * Hook to check if user has any of the required permissions
 */
export function useHasAnyPermission(requiredPermissions: Permission[]): boolean {
  const { permissions } = usePermissions();
  return hasAnyPermission(permissions, requiredPermissions);
}

/**
 * Hook to check if user has all required permissions
 */
export function useHasAllPermissions(requiredPermissions: Permission[]): boolean {
  const { permissions } = usePermissions();
  return hasAllPermissions(permissions, requiredPermissions);
}

/**
 * Hook to check if user can access a route
 */
export function useCanAccessRoute(route: string): boolean {
  const { permissions } = usePermissions();
  return canAccessRoute(permissions, route);
}

/**
 * Hook to check if user is super admin
 */
export function useIsSuperAdmin(): boolean {
  const { role } = usePermissions();
  return isSuperAdmin(role);
}
