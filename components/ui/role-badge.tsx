/**
 * Role Badge Component
 * 
 * Displays user roles with appropriate styling and tooltips
 */

import React from 'react';
import {
  Role,
  PlatformRole,
  ROLE_LABELS,
  ROLE_COLORS,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_COLORS,
} from '@/lib/types/rbac';
import { Shield, Crown, Users, Sparkles, User } from 'lucide-react';

interface RoleBadgeProps {
  role: Role | PlatformRole;
  type?: 'organization' | 'platform';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const ROLE_ICONS: Record<Role | PlatformRole, React.ReactNode> = {
  // Platform roles
  super_admin: <Crown className="w-3 h-3" />,
  user: <User className="w-3 h-3" />,
  
  // Organization roles
  owner: <Shield className="w-3 h-3" />,
  admin: <Sparkles className="w-3 h-3" />,
  organizer: <Users className="w-3 h-3" />,
  member: <User className="w-3 h-3" />,
};

const ROLE_DESCRIPTIONS: Record<Role | PlatformRole, string> = {
  // Platform roles
  super_admin: 'Full access to entire platform and all organizations',
  user: 'Regular platform user',
  
  // Organization roles
  owner: 'Full access to organization hierarchy',
  admin: 'Manage assigned organizations and sub-organizations',
  organizer: 'Create and manage events (requires approval)',
  member: 'Organization member for verification purposes',
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export default function RoleBadge({
  role,
  type = 'organization',
  size = 'md',
  showIcon = true,
  className = '',
}: RoleBadgeProps) {
  const isPlatformRole = type === 'platform' || role === 'super_admin' || role === 'user';
  
  const label = isPlatformRole
    ? PLATFORM_ROLE_LABELS[role as PlatformRole]
    : ROLE_LABELS[role as Role];
    
  const colorClass = isPlatformRole
    ? PLATFORM_ROLE_COLORS[role as PlatformRole]
    : ROLE_COLORS[role as Role];
    
  const icon = ROLE_ICONS[role];
  const description = ROLE_DESCRIPTIONS[role];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colorClass} ${sizeClass} ${className}`}
      title={description}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
}

/**
 * Role Badge List Component
 * 
 * Displays multiple role badges for users with multiple roles
 */
interface RoleBadgeListProps {
  roles: Array<{
    role: Role | PlatformRole;
    type: 'organization' | 'platform';
    organizationName?: string;
  }>;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

export function RoleBadgeList({
  roles,
  size = 'sm',
  maxDisplay = 3,
}: RoleBadgeListProps) {
  const displayRoles = roles.slice(0, maxDisplay);
  const remainingCount = roles.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayRoles.map((item, index) => (
        <div key={index} className="flex flex-col gap-1">
          <RoleBadge
            role={item.role}
            type={item.type}
            size={size}
          />
          {item.organizationName && (
            <span className="text-xs text-gray-500 ml-1">
              in {item.organizationName}
            </span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full border border-gray-300">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
