'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/usePermissions';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  anyPermissions?: Permission[];
  allPermissions?: Permission[];
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * Component to conditionally render based on permissions
 */
export default function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  showLoading = false,
}: PermissionGuardProps) {
  const { permissions, isLoading } = usePermissions();

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  // Check single permission
  if (permission && !hasPermission(permissions, permission)) {
    return <>{fallback}</>;
  }

  // Check any of multiple permissions
  if (anyPermissions && !hasAnyPermission(permissions, anyPermissions)) {
    return <>{fallback}</>;
  }

  // Check all of multiple permissions
  if (allPermissions && !hasAllPermissions(permissions, allPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component to show access denied message
 */
export function AccessDenied({ feature = 'this feature' }: { feature?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 mb-3">Access Denied</h2>

        <p className="text-sm text-zinc-500 mb-6">
          You don't have permission to access {feature}. Please contact your administrator if you
          believe this is an error.
        </p>

        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-left">
          <p className="text-xs font-semibold text-zinc-700 mb-2">Need access?</p>
          <ul className="text-xs text-zinc-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 mt-0.5">•</span>
              <span>Contact your super administrator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 mt-0.5">•</span>
              <span>Request the required permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-zinc-400 mt-0.5">•</span>
              <span>Wait for approval</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
