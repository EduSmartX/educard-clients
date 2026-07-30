/**
 * Authentication API endpoints
 */

import { STORAGE_KEYS } from '@/constants/config';
import { clearQueryCache } from '@/lib/query-client';
import * as SecureStore from '@/lib/secure-store';
import type {
  AuthTokens,
  LoginCredentials,
  User,
  SignupData,
  ForgotPasswordData,
} from '@/types/user';

import apiClient from './client';

// Auth response structure from backend
interface AuthResponse {
  message: string;
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
  organization?: {
    public_id: string;
    name: string;
    is_approved: boolean;
    is_rejected: boolean;
    is_verified: boolean;
  };
}

/**
 * A single active student profile that shares the current login email.
 * Used by the multi-profile (sibling) login/switch flow.
 */
export interface ProfileSummary {
  public_id: string;
  full_name: string;
  class_name: string;
  roll_number: string;
  is_current?: boolean;
}

// Backend returns this instead of tokens when the login email is shared by 2+ students.
interface ProfileSelectionResponse {
  requires_profile_selection: true;
  selection_token: string;
  profiles: ProfileSummary[];
}

/**
 * Result of a login attempt: either a completed session or a request to pick
 * one of several student profiles that share the same login email.
 */
export type LoginResult =
  | { requiresProfileSelection: false; user: User; tokens: AuthTokens }
  | {
      requiresProfileSelection: true;
      selectionToken: string;
      profiles: ProfileSummary[];
    };

/** Persist tokens + user from a successful auth response to secure storage. */
async function persistAuth(user: User, tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
}

/**
 * Login user with email and password.
 *
 * When the login email is shared by 2+ active student accounts, the backend
 * returns a profile-selection payload (no tokens) - the caller must then
 * complete login via `selectProfile()`.
 */
export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  const response = await apiClient.post<
    AuthResponse | ProfileSelectionResponse
  >('/auth/login/', credentials);

  if (
    'requires_profile_selection' in response.data &&
    response.data.requires_profile_selection
  ) {
    return {
      requiresProfileSelection: true,
      selectionToken: response.data.selection_token,
      profiles: response.data.profiles,
    };
  }

  const { user, tokens } = response.data as AuthResponse;

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('No refresh token');
  }

  await persistAuth(user, tokens);

  return { requiresProfileSelection: false, user, tokens };
}

/**
 * Complete login by selecting one of the profiles returned by `login()` for a
 * shared login email. No password required.
 */
export async function selectProfile(data: {
  selection_token: string;
  user_public_id: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await apiClient.post<AuthResponse>(
    '/auth/select-profile/',
    data,
  );
  const { user, tokens } = response.data;

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('No refresh token');
  }

  await persistAuth(user, tokens);
  return { user, tokens };
}

/**
 * Switch the current authenticated student session to another active student
 * profile that shares the same login email. No password required.
 */
export async function switchProfile(data: {
  user_public_id: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await apiClient.post<AuthResponse>(
    '/auth/switch-profile/',
    data,
  );
  const { user, tokens } = response.data;

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('No refresh token');
  }

  await persistAuth(user, tokens);
  return { user, tokens };
}

/**
 * List active student profiles linked to the current student's login email,
 * for the "switch profile" picker.
 */
export async function getLinkedProfiles(): Promise<ProfileSummary[]> {
  const response = await apiClient.get<{
    data?: { profiles?: ProfileSummary[] };
  }>('/auth/linked-profiles/');
  return response.data.data?.profiles ?? [];
}

/**
 * Request an OTP (sent to the student's own login email) to link every active
 * student account that shares this email, unlocking profile switching.
 */
export async function requestProfileSyncOtp(): Promise<{
  message: string;
  expires_in_minutes: number;
}> {
  const response = await apiClient.post<{
    message: string;
    expires_in_minutes: number;
  }>('/auth/profile-sync/request-otp/', {});
  return response.data;
}

/**
 * Verify the profile-sync OTP and link every active student account sharing
 * this email. Optionally sets one shared password for all linked profiles.
 */
export async function verifyProfileSync(data: {
  otp: string;
  new_password?: string;
  confirm_password?: string;
}): Promise<{ message: string; linked_profiles_count: number }> {
  const response = await apiClient.post<{
    message: string;
    linked_profiles_count: number;
  }>('/auth/profile-sync/verify/', data);
  return response.data;
}

/**
 * Register new user
 */
export async function signup(
  data: SignupData,
): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await apiClient.post<AuthResponse>('/auth/register/', data);

  const { user, tokens } = response.data;

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('Registration successful but no tokens returned');
  }

  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

  return { user, tokens };
}

/**
 * Request password reset OTP (forgot password flow)
 */
export async function forgotPassword(
  data: ForgotPasswordData,
): Promise<{ message: string; expires_in_minutes: number }> {
  const response = await apiClient.post<{
    message: string;
    expires_in_minutes: number;
  }>('/auth/password-reset-request/', data);
  return response.data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout/');
  } catch {
    // Ignore errors on logout
  } finally {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    clearQueryCache();
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ data: User }>('/auth/me/');
  return response.data.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<string> {
  const refresh = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refresh) {
    throw new Error('No refresh token available');
  }

  const response = await apiClient.post<{ access: string }>(
    '/auth/token/refresh/',
    {
      refresh,
    },
  );

  const { access } = response.data;
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);

  return access;
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(): Promise<User | null> {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) {
      return null;
    }

    const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }

    return await getCurrentUser();
  } catch {
    return null;
  }
}

/**
 * Request password reset OTP
 */
export async function requestPasswordResetOtp(
  email: string,
  channel: 'email' | 'sms' | 'both' = 'email',
): Promise<{ message: string; expires_in_minutes: number }> {
  const response = await apiClient.post<{
    message: string;
    expires_in_minutes: number;
  }>('/auth/password-reset-request/', { email, channel });
  return response.data;
}

/**
 * Verify OTP and reset password
 */
export async function verifyPasswordResetOtp(data: {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    '/auth/password-reset-verify/',
    data,
  );
  return response.data;
}

/**
 * Change password for authenticated user
 */
export async function changePassword(data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(
    '/auth/change-password/',
    data,
  );
  return response.data;
}

/**
 * Send OTP for email or phone verification
 */
export async function sendOtp(data: {
  purpose: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION';
  email?: string;
  phone?: string;
}): Promise<{ message: string; expires_in_minutes: number }> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: { expires_in_minutes: number };
  }>('/users/send-otp/', data);
  return {
    message: response.data.message,
    expires_in_minutes: response.data.data.expires_in_minutes,
  };
}

/**
 * Update email with OTP verification
 */
export async function updateEmail(data: {
  new_email: string;
  otp: string;
}): Promise<{ message: string; email: string }> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: { email: string };
  }>('/users/update-email/', data);
  return { message: response.data.message, email: response.data.data.email };
}

/**
 * Update phone with OTP verification
 */
export async function updatePhone(data: {
  new_phone: string;
  otp: string;
}): Promise<{ message: string; phone: string }> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: { phone: string };
  }>('/users/update-phone/', data);
  return { message: response.data.message, phone: response.data.data.phone };
}

// Export all auth functions as authApi object for convenience
export const authApi = {
  login,
  signup,
  logout,
  forgotPassword,
  getCurrentUser,
  checkAuth,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  changePassword,
  sendOtp,
  updateEmail,
  updatePhone,
  selectProfile,
  switchProfile,
  getLinkedProfiles,
  requestProfileSyncOtp,
  verifyProfileSync,
};
