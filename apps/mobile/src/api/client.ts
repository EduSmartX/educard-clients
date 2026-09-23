/**
 * API Client with Axios
 * Handles authentication, token refresh, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_CONFIG, STORAGE_KEYS } from '@/constants/config';
import { useAuthStore } from '@/lib/auth-store';
import { clearQueryCache } from '@/lib/query-client';
import * as SecureStore from '@/lib/secure-store';
import { resetToAuth } from '@/navigation/navigation-service';

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

// Track if we're already handling a 401 to prevent loops
let isHandling401 = false;

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
      // Only attach our token to backend requests — never to cross-origin URLs
      // (e.g. R2 presigned URLs reject a request that also carries a Bearer header).
      const requestUrl = config.url ?? '';
      const isAbsolute = /^https?:\/\//i.test(requestUrl);
      const apiOrigin = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
      const targetsBackend = !isAbsolute || requestUrl.startsWith(apiOrigin);

      if (targetsBackend) {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Token retrieval failed - continue without auth header
    }
    return config;
  },
  (error: Error) => Promise.reject(error),
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip token refresh for auth endpoints (login, register, etc.)
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/token') ||
      originalRequest.url?.includes('/organizations/register') ||
      originalRequest.url?.includes('/organizations/otp');

    // Handle 401 - Token expired (but not for auth endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isHandling401
    ) {
      originalRequest._retry = true;
      isHandling401 = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(
          STORAGE_KEYS.REFRESH_TOKEN,
        );

        if (!refreshToken) {
          await forceLogout();
          throw new Error('Session expired. Please login again.');
        }

        // Try to refresh the token
        const response = await axios.post<{ access: string }>(
          `${API_CONFIG.BASE_URL}/auth/token/refresh/`,
          { refresh: refreshToken },
        );

        const { access } = response.data;

        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access);

        isHandling401 = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        return apiClient(originalRequest);
      } catch {
        await forceLogout();
        throw new Error('Session expired. Please login again.');
      }
    }

    throw error;
  },
);

// Helper to force logout - clears tokens and auth store state
async function forceLogout(): Promise<void> {
  isHandling401 = false;

  clearQueryCache();

  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  } catch {
    // Silent fail - best effort cleanup
  }

  // Clearing auth state makes RootNavigator switch to the Auth stack.
  useAuthStore.setState({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  resetToAuth();
}

// Helper to clear auth tokens (for external use)
export async function clearAuthTokens(): Promise<void> {
  await forceLogout();
}

export default apiClient;
