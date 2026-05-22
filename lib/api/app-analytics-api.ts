import backendClient from './backend-client';

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  platform?: 'ios' | 'android' | 'all';
}

export interface ReviewsQueryParams extends AnalyticsQueryParams {
  rating?: number;
  page?: number;
  pageSize?: number;
}

export interface CrashesQueryParams extends AnalyticsQueryParams {
  appVersion?: string;
  crashType?: 'crash' | 'anr' | 'exception';
  page?: number;
  pageSize?: number;
}

/**
 * App Analytics API Client
 * Fetches analytics data from backend
 */
export const appAnalyticsApi = {
  /**
   * Get analytics overview
   */
  async getOverview(params?: AnalyticsQueryParams) {
    const response = await backendClient.get('/app-analytics/overview', { params });
    return response.data;
  },

  /**
   * Get revenue analytics
   */
  async getRevenue(params?: AnalyticsQueryParams) {
    const response = await backendClient.get('/app-analytics/revenue', { params });
    return response.data;
  },

  /**
   * Get user analytics
   */
  async getUserAnalytics(params?: AnalyticsQueryParams) {
    const response = await backendClient.get('/app-analytics/users', { params });
    return response.data;
  },

  /**
   * Get reviews
   */
  async getReviews(params?: ReviewsQueryParams) {
    const response = await backendClient.get('/app-analytics/reviews', { params });
    return response.data;
  },

  /**
   * Get crash analytics
   */
  async getCrashAnalytics(params?: CrashesQueryParams) {
    const response = await backendClient.get('/app-analytics/crashes', { params });
    return response.data;
  },

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const response = await backendClient.get('/app-analytics/sync/status');
    return response.data;
  },
};
