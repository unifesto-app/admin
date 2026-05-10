/**
 * Organizations API
 * 
 * API wrapper functions for organization-related endpoints
 */

import backendClient, { apiCall, ApiError } from './backend-client';
import {
  Organization,
  OrganizationWithHierarchy,
  HierarchyNode,
  UserPermissions,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationQueryParams,
  PaginatedResponse,
} from '../types/rbac';

/**
 * Get all organizations (filtered by user access)
 */
export async function getOrganizations(
  params?: OrganizationQueryParams
): Promise<{ data: PaginatedResponse<OrganizationWithHierarchy> | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get('/organizations', { params })
  );
}

/**
 * Get organization by ID
 */
export async function getOrganization(
  id: string
): Promise<{ data: OrganizationWithHierarchy | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/organizations/${id}`)
  );
}

/**
 * Create new organization
 */
export async function createOrganization(
  data: CreateOrganizationDto
): Promise<{ data: Organization | null; error: ApiError | null }> {
  return apiCall(
    backendClient.post('/organizations', data)
  );
}

/**
 * Update organization
 */
export async function updateOrganization(
  id: string,
  data: UpdateOrganizationDto
): Promise<{ data: Organization | null; error: ApiError | null }> {
  return apiCall(
    backendClient.patch(`/organizations/${id}`, data)
  );
}

/**
 * Delete organization (soft delete)
 */
export async function deleteOrganization(
  id: string
): Promise<{ data: { message: string } | null; error: ApiError | null }> {
  return apiCall(
    backendClient.delete(`/organizations/${id}`)
  );
}

/**
 * Get organization hierarchy tree
 */
export async function getOrganizationHierarchy(
  id: string
): Promise<{ data: HierarchyNode | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/organizations/${id}/hierarchy`)
  );
}

/**
 * Get user's permissions for organization
 */
export async function getOrganizationPermissions(
  id: string
): Promise<{ data: UserPermissions | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/organizations/${id}/permissions`)
  );
}

/**
 * Get sub-organizations
 */
export async function getSubOrganizations(
  id: string,
  params?: OrganizationQueryParams
): Promise<{ data: OrganizationWithHierarchy[] | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/organizations/${id}/sub-organizations`, { params })
  );
}
