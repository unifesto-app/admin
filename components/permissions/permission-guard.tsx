/**
 * Permission Guard Component
 * 
 * Conditionally renders content based on user permissions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserPermissions, Role } from '@/lib/types/rbac';
import { getOrganizationPermissions } from '@/lib/api/organizations-api';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  organizationId?: string;
  requiredRole?: Role;
  requiredPermission?: keyof UserPermissions['permissions'];
  requirePlatformAdmin?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export default function PermissionGuard({
  children,
  organizationId,
  requiredRole,
  requiredPermission,
  requirePlatformAdmin = false,
  fallback,
  showFallback = true,
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, [organizationId, requiredRole, requiredPermission, requirePlatformAdmin]);

  const checkPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      // Check platform admin
      if (requirePlatformAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'super_admin') {
          setHasPermission(true);
          setLoading(false);
          return;
        } else {
          setHasPermission(false);
          setLoading(false);
          return;
        }
      }

      // Check organization permissions
      if (organizationId) {
        const { data: permissions, error } = await getOrganizationPermissions(organizationId);

        if (error || !permissions) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Check required role
        if (requiredRole) {
          const roleHierarchy: Record<Role, number> = {
            owner: 4,
            admin: 3,
            organizer: 2,
            member: 1,
          };

          const userRoleLevel = roleHierarchy[permissions.role];
          const requiredRoleLevel = roleHierarchy[requiredRole];

          if (userRoleLevel < requiredRoleLevel) {
            setHasPermission(false);
            setLoading(false);
            return;
          }
        }

        // Check specific permission
        if (requiredPermission) {
          if (!permissions.permissions[requiredPermission]) {
            setHasPermission(false);
            setLoading(false);
            return;
          }
        }

        setHasPermission(true);
      } else {
        // No specific checks, allow access
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-500">Checking permissions...</div>
      </div>
    );
  }

  if (!hasPermission) {
    if (!showFallback) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <Lock className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600 text-center max-w-md">
          You don't have permission to access this content. Please contact an administrator if you
          believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Platform Admin Guard
 * 
 * Shorthand for requiring platform admin access
 */
interface PlatformAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function PlatformAdminGuard({
  children,
  fallback,
  showFallback = true,
}: PlatformAdminGuardProps) {
  return (
    <PermissionGuard
      requirePlatformAdmin={true}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Organization Admin Guard
 * 
 * Shorthand for requiring admin access to an organization
 */
interface OrgAdminGuardProps {
  children: React.ReactNode;
  organizationId: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export function OrgAdminGuard({
  children,
  organizationId,
  fallback,
  showFallback = true,
}: OrgAdminGuardProps) {
  return (
    <PermissionGuard
      organizationId={organizationId}
      requiredRole="admin"
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Hook for checking permissions
 */
export function usePermissions(organizationId?: string) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, [organizationId]);

  const loadPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Check platform admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsPlatformAdmin(profile?.role === 'super_admin');

      // Get organization permissions
      if (organizationId) {
        const { data, error } = await getOrganizationPermissions(organizationId);
        if (!error && data) {
          setPermissions(data);
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: Role): boolean => {
    if (isPlatformAdmin) return true;
    if (!permissions) return false;

    const roleHierarchy: Record<Role, number> = {
      owner: 4,
      admin: 3,
      organizer: 2,
      member: 1,
    };

    return roleHierarchy[permissions.role] >= roleHierarchy[role];
  };

  const hasPermission = (permission: keyof UserPermissions['permissions']): boolean => {
    if (isPlatformAdmin) return true;
    if (!permissions) return false;
    return permissions.permissions[permission];
  };

  return {
    permissions,
    isPlatformAdmin,
    loading,
    hasRole,
    hasPermission,
  };
}
