/**
 * Analytics API
 * 
 * API wrapper functions for analytics endpoints
 */

import backendClient, { apiCall, ApiError } from './backend-client';
import {
  OverallAnalytics,
  IndividualAnalytics,
  AnalyticsQueryParams,
} from '../types/rbac';

/**
 * Get overall analytics for organization
 */
export async function getOverallAnalytics(
  organizationId: string,
  params?: AnalyticsQueryParams
): Promise<{ data: OverallAnalytics | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/analytics/organizations/${organizationId}/overall`, { params })
  );
}

/**
 * Get individual analytics breakdown
 */
export async function getIndividualAnalytics(
  organizationId: string,
  params?: AnalyticsQueryParams
): Promise<{ data: IndividualAnalytics[] | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/analytics/organizations/${organizationId}/individual`, { params })
  );
}

/**
 * Get event analytics
 */
export async function getEventAnalytics(
  eventId: string,
  params?: AnalyticsQueryParams
): Promise<{ data: any | null; error: ApiError | null }> {
  return apiCall(
    backendClient.get(`/analytics/events/${eventId}`, { params })
  );
}

/**
 * Export analytics report
 */
export async function exportAnalytics(
  organizationId: string,
  params?: AnalyticsQueryParams
): Promise<{ data: { download_url: string } | null; error: ApiError | null }> {
  return apiCall(
    backendClient.post(`/analytics/organizations/${organizationId}/export`, params)
  );
}
