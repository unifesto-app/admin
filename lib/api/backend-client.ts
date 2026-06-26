/**
 * Backend API Client
 * 
 * Centralized Axios client for communicating with the NestJS backend.
 * Handles authentication, request/response interceptors, and error handling.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Backend API base URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

// Get token from cookie (primary) or localStorage (fallback)
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // First try to get from cookie
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('unifesto_admin_token='));
  
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  // Fallback to localStorage for backwards compatibility
  return localStorage.getItem('unifesto_admin_token');
};

// Create axios instance
const backendClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add authentication token
backendClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get token from localStorage
      const token = getToken();
      
      // Add JWT token to Authorization header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Error adding auth token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
backendClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          console.error('Unauthorized access - redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - insufficient permissions
          console.error('Forbidden:', data.message || 'Insufficient permissions');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;
          
        case 422:
          // Validation error
          console.error('Validation error:', data.message);
          break;
          
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
          
        default:
          console.error('API error:', data.message || error.message);
      }
      
      // Return formatted error
      return Promise.reject({
        status,
        message: data.message || error.message,
        errors: data.errors || null,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server:', error.message);
      return Promise.reject({
        status: 0,
        message: 'No response from server. Please check your connection.',
        errors: null,
      });
    } else {
      // Error setting up request
      console.error('Request error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message,
        errors: null,
      });
    }
  }
);

// Export client
export default backendClient;

// Export types
export interface ApiError {
  status: number;
  message: string;
  errors: any | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Helper function to handle API calls with consistent error handling
export async function apiCall<T>(
  promise: Promise<any>
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const response = await promise;
    return {
      data: response.data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error as ApiError,
    };
  }
}
