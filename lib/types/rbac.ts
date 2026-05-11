/**
 * RBAC Type Definitions
 * 
 * Shared types for Role-Based Access Control system
 */

// Role types
export type Role = 'owner' | 'admin' | 'organizer' | 'member';
export type PlatformRole = 'super_admin' | 'user';

// Permission structure
export interface Permission {
  can_manage_sub_orgs: boolean;
  can_approve_events: boolean;
  can_view_analytics: boolean;
  can_export_reports: boolean;
  can_manage_members: boolean;
  analytics_scope: 'none' | 'events' | 'organization' | 'hierarchy';
  event_scope: 'all' | 'own';
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'university' | 'college' | 'club' | 'community';
  description: string | null;
  parent_org_id: string | null;
  super_admin_id: string | null;
  depth_level: number;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationWithCounts extends Organization {
  member_count: number;
  sub_org_count: number;
}

export interface OrganizationWithHierarchy extends OrganizationWithCounts {
  super_admin?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  parent_org?: {
    id: string;
    name: string;
    type: string;
    slug: string;
  } | null;
  hierarchy_path?: Array<{
    id: string;
    name: string;
    type: string;
    depth_level: number;
  }>;
}

// Hierarchy tree node
export interface HierarchyNode {
  id: string;
  name: string;
  slug: string;
  type: string;
  depth_level: number;
  member_count: number;
  sub_org_count: number;
  is_active: boolean;
  super_admin_id: string | null;
  children: HierarchyNode[];
}

// Member types
export interface Member {
  id: string;
  user_id: string;
  organization_id: string;
  role: Role;
  permissions: Permission;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface MemberWithProfile extends Member {
  profile: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
    role: PlatformRole;
  };
  content_count?: {
    events: number;
    posts: number;
    comments: number;
  };
}

// Event types
export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'cancelled';
export type EventType = 'online' | 'offline' | 'hybrid';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  slug: string | null;
  organization_id: string;
  created_by: string;
  status: EventStatus;
  start_date: string;
  end_date: string;
  registration_start: string | null;
  registration_end: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  event_type: EventType;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  max_attendees: number | null;
  is_free: boolean;
  price: number | null;
  currency: string | null;
  is_trending: boolean;
  is_featured: boolean;
  submitted_for_approval_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  ownership_status: 'active' | 'transferred' | 'anonymized' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface EventWithDetails extends Event {
  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// Analytics types
export interface OverallAnalytics {
  total_members: number;
  total_events: number;
  active_events: number;
  total_sub_orgs: number;
  growth_rate?: number;
  engagement_rate?: number;
}

export interface IndividualAnalytics {
  id: string;
  name: string;
  type: 'organization' | 'event';
  metrics: {
    members?: number;
    events?: number;
    registrations?: number;
    attendance?: number;
    engagement?: number;
  };
}

export interface AnalyticsData {
  overall: OverallAnalytics;
  individual: IndividualAnalytics[];
  date_range: {
    start_date: string;
    end_date: string;
  };
}

// Content removal types
export type ContentRemovalAction = 'transfer' | 'delete' | 'anonymize';
export type ContentRemovalStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ContentRemovalRequest {
  id: string;
  user_id: string;
  organization_id: string;
  content_type: 'event' | 'post' | 'comment';
  content_id: string;
  action: ContentRemovalAction;
  transfer_to_user_id: string | null;
  status: ContentRemovalStatus;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  notes: string | null;
}

// API request/response types
export interface CreateOrganizationDto {
  name: string;
  slug: string;
  type: 'university' | 'college' | 'club' | 'community';
  description?: string;
  parent_org_id?: string;
  super_admin_id?: string;
  logo_url?: string;
  banner_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  slug?: string;
  type?: 'university' | 'college' | 'club' | 'community';
  description?: string;
  parent_org_id?: string;
  super_admin_id?: string;
  logo_url?: string;
  banner_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  is_active?: boolean;
}

export interface AddMemberDto {
  user_id: string;
  role: Role;
  permissions?: Partial<Permission>;
}

export interface UpdateMemberRoleDto {
  role: Role;
  permissions?: Partial<Permission>;
}

export interface OrganizationQueryParams {
  role?: Role;
  type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AnalyticsQueryParams {
  start_date?: string;
  end_date?: string;
  metrics?: string[];
}

// User permissions
export interface UserPermissions {
  organization_id: string;
  role: Role;
  permissions: Permission;
  access_type: 'direct' | 'hierarchy';
  can_manage: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Role labels and colors
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Org Super Admin',
  admin: 'Org Admin',
  organizer: 'Organizer',
  member: 'Member',
};

export const ROLE_COLORS: Record<Role, string> = {
  owner: 'bg-blue-100 text-blue-800 border-blue-300',
  admin: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  organizer: 'bg-green-100 text-green-800 border-green-300',
  member: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  super_admin: 'Platform Super Admin',
  user: 'User',
};

export const PLATFORM_ROLE_COLORS: Record<PlatformRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
  user: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const ORG_TYPE_LABELS: Record<string, string> = {
  university: 'University',
  college: 'College',
  club: 'Club',
  community: 'Community',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
  cancelled: 'Cancelled',
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  published: 'bg-blue-100 text-blue-800 border-blue-300',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};
