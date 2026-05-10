/**
 * Super Admin Indicator Component
 * 
 * Shows who is the super admin of an organization
 */

'use client';

import React, { useState } from 'react';
import { Shield, Crown, User as UserIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SuperAdminIndicatorProps {
  organizationId: string;
  organizationName: string;
  superAdmin?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  canTransfer?: boolean;
  onTransfer?: () => void;
}

export default function SuperAdminIndicator({
  organizationId,
  organizationName,
  superAdmin,
  canTransfer = false,
  onTransfer,
}: SuperAdminIndicatorProps) {
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  if (!superAdmin) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900">No Super Admin Assigned</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This organization does not have a super admin. A super admin has full access to the
              entire organization hierarchy.
            </p>
            {canTransfer && (
              <Button
                onClick={() => setShowTransferDialog(true)}
                className="mt-3"
                size="sm"
              >
                Assign Super Admin
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-blue-200 bg-blue-50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-blue-900">Organization Super Admin</h4>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
              Full Hierarchy Access
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {superAdmin.avatar_url ? (
              <img
                src={superAdmin.avatar_url}
                alt={superAdmin.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-blue-700" />
              </div>
            )}
            <div>
              <div className="font-medium text-blue-900">{superAdmin.name}</div>
              <div className="text-sm text-blue-700">{superAdmin.email}</div>
            </div>
          </div>
          <p className="text-sm text-blue-700 mt-3">
            This user has full access to <strong>{organizationName}</strong> and all its
            sub-organizations (entire hierarchy).
          </p>
          {canTransfer && (
            <Button
              onClick={() => setShowTransferDialog(true)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Transfer Super Admin Role
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Super Admin Badge
 * 
 * Small badge to indicate super admin status
 */
interface SuperAdminBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SuperAdminBadge({ size = 'md', showLabel = true }: SuperAdminBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300 ${sizeClasses[size]}`}
      title="Organization Super Admin - Full hierarchy access"
    >
      <Shield className={iconSizes[size]} />
      {showLabel && <span>Super Admin</span>}
    </span>
  );
}
