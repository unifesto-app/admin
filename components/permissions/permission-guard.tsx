/**
 * Permission Guard Component
 * 
 * Conditionally renders content based on user permissions
 */

'use client';

import React, { useEffect, useState } from 'react';
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
      // TODO: Replace with backend API authentication
      setHasPermission(false);
      setLoading(false);
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
      // TODO: Replace with backend API authentication
      setIsPlatformAdmin(false);
      setPermissions(null);
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
    return Boolean(permissions.permissions[permission]);
  };

  return {
    permissions,
    isPlatformAdmin,
    loading,
    hasRole,
    hasPermission,
  };
}
