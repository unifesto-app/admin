/**
 * Admin Users API Client
 * Calls backend /admin/users endpoints
 */

import backendClient, { apiCall } from './backend-client';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  role: 'attendee' | 'organizer' | 'admin' | 'super_admin' | 'support';
  is_active: boolean;
  is_banned: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
  is_banned?: boolean;
  is_verified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  is_banned?: boolean;
  is_verified?: boolean;
  avatar_url?: string;
  bio?: string;
}

export interface BulkOperationRequest {
  action: 'activate' | 'deactivate' | 'ban' | 'unban' | 'verify' | 'unverify' | 'delete' | 'promote_to_organizer' | 'demote_to_attendee';
  userIds: string[];
  reason?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  affected: number;
  message: string;
}

export interface UserStatsResponse {
  total: number;
  active: number;
  banned: number;
  verified: number;
  by_role: Record<string, number>;
}

/**
 * Get list of users with pagination and filters
 */
export async function getUsers(params?: UserListParams) {
  return apiCall<UserListResponse>(
    backendClient.get('/admin/users', { params })
  );
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  return apiCall<User>(
    backendClient.get(`/admin/users/${id}`)
  );
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserRequest) {
  return apiCall<{ user: User; message: string }>(
    backendClient.post('/admin/users', data)
  );
}

/**
 * Update user
 */
export async function updateUser(id: string, data: UpdateUserRequest) {
  return apiCall<{ user: User; message: string }>(
    backendClient.patch(`/admin/users/${id}`, data)
  );
}

/**
 * Delete user
 */
export async function deleteUser(id: string) {
  return apiCall<{ message: string }>(
    backendClient.delete(`/admin/users/${id}`)
  );
}

/**
 * Bulk operations on users
 */
export async function bulkOperation(data: BulkOperationRequest) {
  return apiCall<BulkOperationResponse>(
    backendClient.post('/admin/users/bulk', data)
  );
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  return apiCall<UserStatsResponse>(
    backendClient.get('/admin/users/stats')
  );
}
