/**
 * Authentication Client
 * 
 * Handles authentication with the new NestJS backend auth system.
 * Supports Google, Apple, Email, and Mobile authentication flows.
 */

import axios, { AxiosInstance } from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export interface UserProfile {
  id: string;
  mobileNumber: string;
  mobileVerified: boolean;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
  requiresMobileVerification: boolean;
  tempToken?: string;
}

export interface SessionResponse {
  user: UserProfile;
}

class AuthClient {
  private api: AxiosInstance;
  private tokenKey = 'unifesto_admin_token';

  constructor() {
    this.api = axios.create({
      baseURL: `${BACKEND_URL}/auth`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get stored access token from cookie (primary) or localStorage (fallback)
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // First try to get from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith(`${this.tokenKey}=`));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Fallback to localStorage for backwards compatibility
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Store access token
   */
  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token);
    
    // Also store in cookie for middleware
    document.cookie = `${this.tokenKey}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }

  /**
   * Remove access token
   */
  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.tokenKey);
    
    // Also remove from cookie
    document.cookie = `${this.tokenKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/google', {
      idToken,
    });
    
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Login with Apple
   */
  async loginWithApple(identityToken: string, authorizationCode: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/apple', {
      identityToken,
      authorizationCode,
    });
    
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Send email OTP
   */
  async sendEmailOtp(email: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/email', {
      email,
    });
    return response.data;
  }

  /**
   * Verify email OTP
   */
  async verifyEmailOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/email/verify', {
      email,
      otp,
    });
    
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Send mobile OTP
   */
  async sendMobileOtp(mobileNumber: string, tempToken: string): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/mobile/send-otp', {
      mobileNumber,
      tempToken,
    });
    return response.data;
  }

  /**
   * Verify mobile number
   */
  async verifyMobile(mobileNumber: string, otp: string, tempToken: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/verify-mobile', {
      mobileNumber,
      otp,
      tempToken,
    });
    
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
    }
    
    return response.data;
  }

  /**
   * Get current session
   */
  async getSession(): Promise<SessionResponse | null> {
    try {
      const response = await this.api.get<SessionResponse>('/session');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/logout');
    } finally {
      this.removeToken();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Export singleton instance
export const authClient = new AuthClient();
export default authClient;
