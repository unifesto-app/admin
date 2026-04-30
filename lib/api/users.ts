import type {
  UserListResponse,
  UserResponse,
  UserCreateRequest,
  UserCreateResponse,
  UserUpdateRequest,
  UserUpdateResponse,
  UserDeleteResponse,
  UserStatsResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  UserListParams,
} from '@/lib/types/api';

const API_BASE = '/api/users';

/**
 * Fetch a paginated list of users with optional filters
 */
export async function getUsers(params?: UserListParams): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.role) searchParams.set('role', params.role);
  if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
  if (params?.is_banned !== undefined) searchParams.set('is_banned', params.is_banned.toString());
  if (params?.is_verified !== undefined) searchParams.set('is_verified', params.is_verified.toString());
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const url = `${API_BASE}?${searchParams.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch users');
  }

  return response.json();
}

/**
 * Fetch a single user by ID
 */
export async function getUserById(id: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user');
  }

  return response.json();
}

/**
 * Create a new user
 */
export async function createUser(data: UserCreateRequest): Promise<UserCreateResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  return response.json();
}

/**
 * Update an existing user
 */
export async function updateUser(
  id: string,
  data: UserUpdateRequest
): Promise<UserUpdateResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<UserDeleteResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }

  return response.json();
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStatsResponse> {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user stats');
  }

  return response.json();
}

/**
 * Perform bulk operations on users
 */
export async function bulkOperateUsers(
  data: BulkOperationRequest
): Promise<BulkOperationResponse> {
  const response = await fetch(`${API_BASE}/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to perform bulk operation');
  }

  return response.json();
}

// Convenience functions for common operations

/**
 * Activate multiple users
 */
export async function activateUsers(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'activate', userIds });
}

/**
 * Deactivate multiple users
 */
export async function deactivateUsers(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'deactivate', userIds });
}

/**
 * Ban multiple users
 */
export async function banUsers(userIds: string[], reason?: string): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'ban', userIds, reason });
}

/**
 * Unban multiple users
 */
export async function unbanUsers(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'unban', userIds });
}

/**
 * Verify multiple users
 */
export async function verifyUsers(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'verify', userIds });
}

/**
 * Delete multiple users (Super Admin only)
 */
export async function deleteUsers(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'delete', userIds });
}

/**
 * Promote users to organizer
 */
export async function promoteToOrganizer(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'promote_to_organizer', userIds });
}

/**
 * Promote users to admin (Super Admin only)
 */
export async function promoteToAdmin(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'promote_to_admin', userIds });
}

/**
 * Demote users to attendee
 */
export async function demoteToAttendee(userIds: string[]): Promise<BulkOperationResponse> {
  return bulkOperateUsers({ action: 'demote_to_attendee', userIds });
}
