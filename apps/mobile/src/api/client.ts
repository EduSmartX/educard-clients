/**
 * API Client with Axios
 * Handles authentication, token refresh, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { API_CONFIG, STORAGE_KEYS } from '@/constants/config';
// Use shared error handler
export {
  parseApiError,
  parseError,
  getErrorMessage,
  getFieldErrors,
  isValidationError,
} from '@educard/shared';

/** Default page size for all paginated API calls */
export const DEFAULT_PAGE_SIZE = API_CONFIG.DEFAULT_PAGE_SIZE;

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip token refresh for auth endpoints (login, register, etc.)
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/token') ||
      originalRequest.url?.includes('/organizations/register') ||
      originalRequest.url?.includes('/organizations/otp');

    // Handle 401 - Token expired (but not for auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token - redirect to login
          await clearAuthTokens();
          router.replace('/(auth)/login');
          return Promise.reject(new Error('Session expired. Please login again.'));
        }

        // Try to refresh the token
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Store new access token
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        await clearAuthTokens();
        router.replace('/(auth)/login');
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }

    return Promise.reject(error);
  }
);

// Helper to clear auth tokens
export async function clearAuthTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
}

export default apiClient;
