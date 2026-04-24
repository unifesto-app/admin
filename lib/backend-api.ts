/**
 * Backend API Client for Admin Panel
 * Uses the actual NestJS backend at api.unifesto.app
 */

import { createClient } from '@/utils/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.unifesto.app';

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const token = await getAuthToken();

    if (!token) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return { error: 'Not authenticated' };
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return { error: 'Unauthorized' };
      }

      return {
        error:
          errorData.message ||
          errorData.error ||
          `Request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

/**
 * Upload file with multipart/form-data
 */
async function uploadFile<T>(
  endpoint: string,
  formData: FormData
): Promise<{ data?: T; error?: string }> {
  try {
    const token = await getAuthToken();

    if (!token) {
      return { error: 'Not authenticated' };
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      // Don't set Content-Type for FormData - browser will set it with boundary
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error:
          errorData.message ||
          errorData.error ||
          `Upload failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Profile API (uses existing backend endpoints)
export const profileApi = {
  /**
   * Get current user profile
   */
  getMe: () => apiRequest<any>('/auth/me'),

  /**
   * Sync/create profile
   */
  sync: () => apiRequest<any>('/auth/sync', { method: 'POST' }),

  /**
   * Update profile
   */
  update: (data: {
    name?: string;
    username?: string;
    bio?: string;
    phone?: string;
  }) =>
    apiRequest<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Upload avatar
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return uploadFile<{ message: string; avatar_url: string }>(
      '/auth/avatar',
      formData
    );
  },

  /**
   * Delete avatar
   */
  deleteAvatar: () =>
    apiRequest<{ message: string }>('/auth/avatar', { method: 'DELETE' }),
};

// Users API (for admin management)
// Note: These endpoints don't exist in backend yet, so they'll return errors
// You'll need to implement these in the backend
export const usersApi = {
  /**
   * List all users (admin only)
   * TODO: Implement in backend
   */
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);

    return apiRequest<{
      data: any[];
      meta: { page: number; limit: number; total: number };
    }>(`/admin/users?${query.toString()}`);
  },

  /**
   * Get user by ID (admin only)
   * TODO: Implement in backend
   */
  get: (id: string) => apiRequest<any>(`/admin/users/${id}`),

  /**
   * Create user (admin only)
   * TODO: Implement in backend
   */
  create: (data: { email: string; name?: string; role?: string }) =>
    apiRequest<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update user (admin only)
   * TODO: Implement in backend
   */
  update: (id: string, data: { name?: string; role?: string; status?: string }) =>
    apiRequest<any>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Delete user (admin only)
   * TODO: Implement in backend
   */
  delete: (id: string) =>
    apiRequest<any>(`/admin/users/${id}`, { method: 'DELETE' }),
};

// Health check
export const healthApi = {
  check: () => apiRequest<any>('/auth/health'),
};

export { API_BASE_URL };
