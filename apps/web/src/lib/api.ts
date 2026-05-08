import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { ErrorMessages } from '@/constants';

// API Base URL from environment
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://educard-backend-zgz9.onrender.com/api';

// Define proper types for API error responses
interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  detail?: string;
  non_field_errors?: string[];
  errors?: Array<{ email: string; error: string }> | Record<string, string | string[]>;
  data?: unknown;
  code?: number;
  [key: string]: unknown;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout user completely
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');

        // Broadcast logout to all tabs
        localStorage.setItem('logout-event', Date.now().toString());
        localStorage.removeItem('logout-event');

        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    handleApiError(error);
    return Promise.reject(error);
  }
);

/**
 * Handle API errors and show toast notifications
 */
function handleApiError(error: AxiosError): void {
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const data = error.response.data as ApiErrorResponse;

    // Skip toast for OTP validation errors (will be handled by form)
    const isOtpError =
      error.config?.url?.includes('/otp/') &&
      status === 400 &&
      data.detail &&
      data.errors &&
      Array.isArray(data.errors);

    // Skip toast for login errors (will be handled by login form)
    const isLoginError = error.config?.url?.includes('/auth/login') && status === 401;

    if (isOtpError || isLoginError) {
      // Don't show toast - errors will be displayed on the form
      return;
    }

    const hasFieldErrors = status === 400 && data.errors && typeof data.errors === 'object';
    if (hasFieldErrors) {
      return;
    }

    // Skip toast for standard backend 400 responses (success=false, message=string)
    // These will be handled by mutation onError handlers via handleMutationError
    const isStandardBackendError =
      status === 400 &&
      data.success === false &&
      typeof data.message === 'string' &&
      data.message.length > 0;
    if (isStandardBackendError) {
      return;
    }

    switch (status) {
      case 400:
        // Bad Request - Show validation errors
        if (data.message && typeof data.message === 'string') {
          toast.error(data.message);
        } else if (data.detail) {
          toast.error(data.detail);
        } else if (data.non_field_errors) {
          toast.error(data.non_field_errors[0]);
        } else {
          toast.error(ErrorMessages.INVALID_REQUEST);
        }
        break;

      case 401:
        break;

      case 403:
        toast.error(ErrorMessages.FORBIDDEN_ACTION);
        break;

      case 404:
        toast.error(ErrorMessages.NOT_FOUND);
        break;

      case 409:
        toast.error(data.message || data.detail || ErrorMessages.CONFLICT);
        break;

      case 422:
        toast.error(ErrorMessages.VALIDATION_ERROR);
        break;

      case 429:
        toast.error(ErrorMessages.TOO_MANY_REQUESTS);
        break;

      case 500:
        toast.error(ErrorMessages.SERVER_ERROR);
        break;

      case 503:
        toast.error(ErrorMessages.SERVICE_UNAVAILABLE);
        break;

      default:
        toast.error(data.message || data.detail || ErrorMessages.GENERIC_RETRY);
    }
  } else if (error.request) {
    // Request made but no response
    toast.error(ErrorMessages.NO_SERVER_RESPONSE);
  } else {
    // Error in request setup
    toast.error(ErrorMessages.GENERIC_RETRY);
  }
}

/**
 * Parse error response to get field-specific errors
 */
export function parseApiErrors(error: AxiosError): Record<string, string> {
  const errors: Record<string, string> = {};

  if (error.response?.data) {
    const data = error.response.data as ApiErrorResponse;

    // Django REST Framework error format
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (Array.isArray(value)) {
        errors[key] = value[0];
      } else if (typeof value === 'string') {
        errors[key] = value;
      }
    });
  }

  return errors;
}

/**
 * Parse OTP validation errors from backend
 * Handles the specific format: { detail: string, errors: Array<{ email: string, error: string }> }
 */
export interface OtpValidationError {
  email: string;
  error: string;
}

export function parseOtpErrors(error: AxiosError): {
  detail: string | null;
  errors: OtpValidationError[];
} {
  if (error.response?.data) {
    const data = error.response.data as ApiErrorResponse;

    // Check if it's the OTP validation error format
    if (data.detail && data.errors && Array.isArray(data.errors)) {
      return {
        detail: data.detail,
        errors: data.errors as OtpValidationError[],
      };
    }
  }

  return {
    detail: null,
    errors: [],
  };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: AxiosError): boolean {
  return !error.response && Boolean(error.request);
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: AxiosError): boolean {
  return Boolean(error.response && error.response.status >= 500);
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: AxiosError): boolean {
  return Boolean(error.response && error.response.status >= 400 && error.response.status < 500);
}

export default apiClient;
