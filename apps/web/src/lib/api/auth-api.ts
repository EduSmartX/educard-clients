import api from '../api';
import { getParsedLocalStorageItem } from '@/lib/utils/storage';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  otp?: string; // For OTP verification
}

export interface AuthResponse {
  message: string;
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
  organization?: Organization;
}

export interface User {
  public_id: string;
  username: string;
  email: string;
  role: string;
  full_name: string;
  profile_image?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface Organization {
  public_id: string;
  name: string;
  organization_type: string;
  email: string;
  phone: string;
  website_url?: string;
  board_affiliation?: string;
  legal_entity?: string;
  logo?: string;
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
  is_rejected: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  password_confirm: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface OTPVerificationData {
  email: string;
  otp: string;
}

export interface PasswordResetRequestData {
  username?: string;
  email?: string;
}

export interface PasswordResetVerifyData {
  username?: string;
  email?: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

// API Functions
export const authApi = {
  /**
   * Login with email/username and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login/', credentials);
    // Store tokens and user data
    if (data.tokens?.access) {
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.organization) {
        localStorage.setItem('organization', JSON.stringify(data.organization));
      }
    }
    return data;
  },

  /**
   * Register a new user
   */
  signup: async (signupData: SignupData): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register/', signupData);
    // Store tokens and user data if registration is successful
    if (data.tokens?.access) {
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.organization) {
        localStorage.setItem('organization', JSON.stringify(data.organization));
      }
    }
    return data;
  },

  /**
   * Logout and invalidate tokens
   */
  logout: async (): Promise<void> => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (accessToken && refreshToken) {
        await api.post('/auth/logout/', {
          access: accessToken,
          refresh: refreshToken,
        });
      }
    } catch {
      // Ignore logout API errors
    } finally {
      // Clear all localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const { data } = await api.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    if (data.access) {
      localStorage.setItem('access_token', data.access);
    }
    return data;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get('/auth/me/');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  /**
   * Update current user profile
   */
  updateProfile: async (formData: Partial<User> & { profile_image?: File }): Promise<User> => {
    // If profile_image exists, send as multipart/form-data
    if (formData.profile_image) {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert value to string for FormData
          form.append(
            key,
            typeof value === 'object' && !(value instanceof File)
              ? JSON.stringify(value)
              : String(value)
          );
        }
      });
      const { data } = await api.patch('/auth/me/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    }

    // Otherwise send as JSON
    const { data } = await api.patch('/auth/me/', formData);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  /**
   * Request password reset email
   */
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/password-reset/', { email });
    return data;
  },

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset: async (resetData: PasswordResetConfirm): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/password-reset/confirm/', resetData);
    return data;
  },

  /**
   * Change password for logged-in user
   */
  changePassword: async (passwordData: ChangePasswordData): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/change-password/', passwordData);
    return data;
  },

  /**
   * Send OTP to email for verification
   */
  sendOTP: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/send-otp/', { email });
    return data;
  },

  /**
   * Verify OTP
   */
  verifyOTP: async (
    otpData: OTPVerificationData
  ): Promise<{ message: string; verified: boolean }> => {
    const { data } = await api.post('/auth/verify-otp/', otpData);
    return data;
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/resend-verification/', { email });
    return data;
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/verify-email/', { token });
    return data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  /**
   * Get stored user data
   */
  getStoredUser: (): User | null => {
    return getParsedLocalStorageItem<User>('user');
  },

  /**
   * Request password reset OTP
   */
  requestPasswordResetOtp: async (
    requestData: PasswordResetRequestData
  ): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/password-reset-request/', requestData);
    return data;
  },

  /**
   * Verify OTP and reset password
   */
  verifyPasswordResetOtp: async (
    verifyData: PasswordResetVerifyData
  ): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/password-reset-verify/', verifyData);
    return data;
  },
};
