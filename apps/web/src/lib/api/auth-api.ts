import api from '../api';
import { tokenManager } from '@/lib/token-manager';
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
  phone?: string;
  role: string;
  full_name: string;
  profile_image?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  // Guardian fields (for student/parent roles)
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_email_verified?: boolean;
  guardian_phone_verified?: boolean;
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

// Multi-profile student login (shared login email across student accounts)
export interface ProfileSummary {
  public_id: string;
  full_name: string;
  class_name: string;
  roll_number: string;
  is_current?: boolean;
}

export interface ProfileSelectionResponse {
  message: string;
  requires_profile_selection: true;
  selection_token: string;
  profiles: ProfileSummary[];
  organization?: Organization;
}

export interface SelectProfileData {
  selection_token: string;
  user_public_id: string;
}

export interface SwitchProfileData {
  user_public_id: string;
}

export function isProfileSelectionResponse(
  response: AuthResponse | ProfileSelectionResponse
): response is ProfileSelectionResponse {
  return 'requires_profile_selection' in response && response.requires_profile_selection === true;
}

/**
 * Persist the access token (in memory) and user/organization (in localStorage)
 * from a successful `AuthResponse`. Shared by `login()`, `selectProfile()`,
 * `switchProfile()`, and `signup()` so the storage logic stays in one place.
 */
function persistAuthResponse(data: AuthResponse): void {
  if (!data.tokens?.access) {
    return;
  }
  tokenManager.setAccessToken(data.tokens.access);
  localStorage.setItem('user', JSON.stringify(data.user));
  if (data.organization) {
    localStorage.setItem('organization', JSON.stringify(data.organization));
  }
}

// API Functions
export const authApi = {
  /**
   * Login with email/username and password.
   *
   * When the login email is shared by 2+ active student accounts, the
   * backend returns a `ProfileSelectionResponse` instead of tokens - no
   * data is persisted in that case, the caller must complete login via
   * `selectProfile()`.
   */
  login: async (
    credentials: LoginCredentials
  ): Promise<AuthResponse | ProfileSelectionResponse> => {
    const { data } = await api.post('/auth/login/', credentials);
    if (data.requires_profile_selection) {
      return data as ProfileSelectionResponse;
    }
    persistAuthResponse(data);
    return data;
  },

  /**
   * Complete login by selecting one of the profiles returned by `login()`
   * for a shared login email.
   */
  selectProfile: async (selectionData: SelectProfileData): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/select-profile/', selectionData);
    persistAuthResponse(data);
    return data;
  },

  /**
   * Switch the current authenticated student session to another active
   * student profile that shares the same login email. No password required.
   */
  switchProfile: async (switchData: SwitchProfileData): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/switch-profile/', switchData);
    persistAuthResponse(data);
    return data;
  },

  /**
   * List active student profiles linked to the current student's login
   * email, for the "switch profile" picker.
   */
  getLinkedProfiles: async (): Promise<ProfileSummary[]> => {
    const { data } = await api.get('/auth/linked-profiles/');
    return data.data?.profiles ?? [];
  },

  /**
   * Register a new user
   */
  signup: async (signupData: SignupData): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register/', signupData);
    persistAuthResponse(data);
    return data;
  },

  /**
   * Logout and invalidate tokens
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/', {});
    } catch {
      // Ignore logout API errors
    } finally {
      // Clear in-memory token and localStorage user data
      tokenManager.clear();
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<{ access: string }> => {
    // Refresh token is sent automatically via HttpOnly cookie (withCredentials)
    const { data } = await api.post('/auth/token/refresh/', {});
    if (data.access) {
      tokenManager.setAccessToken(data.access);
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
    return tokenManager.isAuthenticated();
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
