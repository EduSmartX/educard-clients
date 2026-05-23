/**
 * Shared API - Client Factory
 * Creates an axios instance that works in both web and mobile
 */

import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// Re-export parseApiError from utils for convenience
export {
  parseApiError,
  parseError,
  getErrorMessage,
  getFieldErrors,
} from "../utils/error-handler";

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  clearTokens: () => Promise<void>;
  onAuthError?: () => void;
}

/**
 * Create an API client instance
 * This factory function allows both web and mobile to create their own client
 * with platform-specific storage implementations
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    async (axiosConfig: InternalAxiosRequestConfig) => {
      const token = await config.getAccessToken();
      if (token && axiosConfig.headers) {
        axiosConfig.headers.Authorization = `Bearer ${token}`;
      }
      return axiosConfig;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor - Handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 - Try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await config.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(
              `${config.baseURL}/auth/token/refresh/`,
              {
                refresh: refreshToken,
              },
            );

            const { access, refresh } = response.data;
            await config.setTokens(access, refresh || refreshToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          await config.clearTokens();
          config.onAuthError?.();
          throw refreshError;
        }
      }

      throw error;
    },
  );

  return client;
}
