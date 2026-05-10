/**
 * Members API
 * 
 * API wrapper functions for member management endpoints
 */

import backendClient, { apiCall, ApiError } from './backend-client';
import {
  MemberWithProfile,
  AddMemberDto,
  UpdateMemberRoleDto,
} from '../types/rbac';

/**
 * Get organization members
 */
export async function getOrganizationMembers(
  organizationId: string,
  params?: { role?: string; page?: number; limit?: number }
): Promise<{ data: MemberWithProfile[] | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/organizations/${organizationId}/members`, { params })
  );
}

/**
 * Add member to organization
 */
export async function addOrganizationMember(
  organizationId: string,
  data: AddMemberDto
): Promise<{ data: MemberWithProfile | null; error: ApiError | null }> {
  return apiCall(
    backendClient.post(`/organizations/${organizationId}/members`, data)
  );
}

/**
 * Update member role/permissions
 */
export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  data: UpdateMemberRoleDto
): Promise<{ data: MemberWithProfile | null; error: ApiError | null }> {
  return apiCall(
    backendClient.patch(`/organizations/${organizationId}/members/${memberId}`, data)
  );
}

/**
 * Remove member from organization
 */
export async function removeMember(
  organizationId: string,
  memberId: string
): Promise<{ data: { message: string } | null; error: ApiError | null }> {
  return apiCall(
    backendClient.delete(`/organizations/${organizationId}/members/${memberId}`)
  );
}
