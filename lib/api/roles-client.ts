/**
 * Roles API Client
 * 
 * Communicates with backend roles endpoints
 */

import backendClient, { apiCall, ApiError } from './backend-client';

export interface Role {
  id: string;
  code: string;
  name: string;
  scope: 'platform' | 'space';
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  spaceId?: string;
  assignedBy?: string;
  createdAt: string;
  role: Role;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  spaceId?: string;
}

/**
 * Get all available roles
 */
export async function getRoles(): Promise<{ data: Role[] | null; error: ApiError | null }> {
  return apiCall(backendClient.get('/roles'));
}

/**
 * Get roles assigned to a user
 */
export async function getUserRoles(userId: string): Promise<{ data: UserRole[] | null; error: ApiError | null }> {
  return apiCall(backendClient.get(`/roles/users/${userId}`));
}

/**
 * Assign role to user
 */
export async function assignRole(request: AssignRoleRequest): Promise<{ data: UserRole | null; error: ApiError | null }> {
  return apiCall(backendClient.post('/roles/assign', request));
}

/**
 * Remove role from user
 */
export async function removeRole(userRoleId: string): Promise<{ data: { message: string } | null; error: ApiError | null }> {
  return apiCall(backendClient.delete(`/roles/${userRoleId}`));
}

/**
 * Check if user has specific role
 */
export async function checkUserRole(userId: string, roleCode: string): Promise<{ data: { hasRole: boolean } | null; error: ApiError | null }> {
  return apiCall(backendClient.get(`/roles/check/${userId}/${roleCode}`));
}
