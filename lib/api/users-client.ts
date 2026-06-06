/**
 * Users API Client
 * 
 * Communicates with backend users endpoints
 */

import backendClient, { apiCall, ApiError } from './backend-client';
import { UserProfile } from '../auth/auth-client';

export interface UpdateProfileRequest {
  username?: string;
  fullName?: string;
  bio?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<{ data: UserProfile | null; error: ApiError | null }> {
  return apiCall(backendClient.get('/users/me'));
}

/**
 * Update current user profile
 */
export async function updateCurrentUser(data: UpdateProfileRequest): Promise<{ data: UserProfile | null; error: ApiError | null }> {
  return apiCall(backendClient.patch('/users/me', data));
}

/**
 * Mark user as onboarded
 */
export async function markAsOnboarded(): Promise<{ data: UserProfile | null; error: ApiError | null }> {
  return apiCall(backendClient.post('/users/me/onboard'));
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<{ data: { avatarUrl: string } | null; error: ApiError | null }> {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return apiCall(
    backendClient.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  );
}

/**
 * Check username availability
 */
export async function checkUsername(username: string): Promise<{ data: { available: boolean } | null; error: ApiError | null }> {
  return apiCall(backendClient.post('/users/check-username', { username }));
}

/**
 * Get user profile by username
 */
export async function getUserByUsername(username: string): Promise<{ data: UserProfile | null; error: ApiError | null }> {
  return apiCall(backendClient.get(`/users/${username}`));
}
