/**
 * Authentication API endpoints
 */

import * as SecureStore from 'expo-secure-store';

import apiClient from './client';
import { STORAGE_KEYS } from '@/constants/config';
import type {
  AuthTokens,
  LoginCredentials,
  User,
  SignupData,
  ForgotPasswordData,
} from '@/types/user';

// Auth response structure from backend (matches web frontend)
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
 * Login user with email and password
 */
export async function login(
  credentials: LoginCredentials
): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);

  // Backend returns tokens and user directly in response.data (not nested in data.data)
  const { user, tokens } = response.data;

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('No refresh token');
  }

  // Store tokens securely
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

  return { user, tokens };
}

/**
 * Register new user
 */
export async function signup(data: SignupData): Promise<{ user: User; tokens: AuthTokens }> {
  const response = await apiClient.post<AuthResponse>('/auth/register/', data);

  // Backend returns tokens and user directly in response.data (not nested in data.data)
  const { user, tokens } = response.data;

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error('Registration successful but no tokens returned');
  }

  // Store tokens securely
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

  return { user, tokens };
}

/**
 * Request password reset OTP (forgot password flow)
 */
export async function forgotPassword(
  data: ForgotPasswordData
): Promise<{ message: string; expires_in_minutes: number }> {
  const response = await apiClient.post<{ message: string; expires_in_minutes: number }>(
    '/auth/password-reset-request/',
    data
  );
  return response.data;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint if available
    await apiClient.post('/auth/logout/');
  } catch {
    // Ignore errors on logout
  } finally {
    // Clear stored tokens
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
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

  const response = await apiClient.post<{ access: string }>('/auth/token/refresh/', {
    refresh,
  });

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

    // Try to get user from stored data first
    const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }

    // Fetch from API
    return await getCurrentUser();
  } catch {
    return null;
  }
}

/**
 * Request password reset OTP
 */
export async function requestPasswordResetOtp(
  email: string
): Promise<{ message: string; expires_in_minutes: number }> {
  const response = await apiClient.post<{ message: string; expires_in_minutes: number }>(
    '/auth/password-reset-request/',
    { email }
  );
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
  const response = await apiClient.post<{ message: string }>('/auth/password-reset-verify/', data);
  return response.data;
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
};
