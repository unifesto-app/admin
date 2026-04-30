import { Profile, PlatformRole } from './database';

// User API Types

export interface UserListResponse {
  users: Profile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserResponse {
  user: Profile;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
  phone?: string;
  role?: PlatformRole;
  is_active?: boolean;
}

export interface UserCreateResponse {
  user: Profile;
  message: string;
}

export interface UserUpdateRequest {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  bio?: string;
  role?: PlatformRole;
  is_active?: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  is_verified?: boolean;
}

export interface UserUpdateResponse {
  user: Profile;
  message: string;
}

export interface UserDeleteResponse {
  message: string;
}

export interface UserStatsResponse {
  stats: {
    total: number;
    active: number;
    inactive: number;
    banned: number;
    verified: number;
    newLast30Days: number;
    byRole: {
      attendee: number;
      organizer: number;
      admin: number;
      superAdmin: number;
    };
  };
  recentUsers: Profile[];
}

export interface BulkOperationRequest {
  action: 'activate' | 'deactivate' | 'ban' | 'unban' | 'verify' | 'delete' | 'promote_to_organizer' | 'promote_to_admin' | 'demote_to_attendee';
  userIds: string[];
  reason?: string; // For ban action
}

export interface BulkOperationResponse {
  message: string;
  affectedCount: number;
}

export interface ApiError {
  error: string;
}

// Query parameters for user list
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: PlatformRole;
  is_active?: boolean;
  is_banned?: boolean;
  is_verified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
