/**
 * API Response Handler Utility
 * Validates and processes standardized API responses from the backend
 *
 * Expected Response Format:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": [...] or {...},
 *   "pagination": {...}, // Optional, for list responses
 *   "code": 200
 * }
 */

// ============================================================================
// Types
// ============================================================================

export interface ApiPagination {
  current_page: number;
  total_pages: number;
  count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: ApiPagination;
  code: number;
}

export interface ApiDetailResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code: number;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates if the response matches the expected API format
 */
export function isValidApiResponse(response: unknown): boolean {
  return (
    response !== null &&
    typeof response === 'object' &&
    'success' in response &&
    'message' in response &&
    'data' in response &&
    'code' in response
  );
}

/**
 * Validates if the response is a list response with pagination
 */
export function isListResponse<T>(response: unknown): response is ApiListResponse<T> {
  if (!isValidApiResponse(response)) return false;

  const apiResponse = response as Record<string, unknown>;
  return (
    Array.isArray(apiResponse.data) &&
    'pagination' in apiResponse &&
    apiResponse.pagination !== null &&
    typeof apiResponse.pagination === 'object'
  );
}

/**
 * Validates if the response is a detail response
 */
export function isDetailResponse<T>(response: unknown): response is ApiDetailResponse<T> {
  return (
    isValidApiResponse(response) &&
    (response as Record<string, unknown>).data !== null &&
    typeof (response as Record<string, unknown>).data === 'object' &&
    !Array.isArray((response as Record<string, unknown>).data)
  );
}

// ============================================================================
// Response Handlers
// ============================================================================

/**
 * Processes a list response and returns the data array
 * Throws an error if the response format is invalid
 */
export function handleListResponse<T>(response: unknown, context?: string): T[] {
  if (!isValidApiResponse(response)) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(
      `Invalid API response format${errorContext}. Expected { success, message, data, code } but got: ${JSON.stringify(response)}`
    );
  }

  const apiResponse = response as Record<string, unknown>;

  if (!apiResponse.success) {
    throw new Error((apiResponse.message as string) || 'API request failed');
  }

  if (!Array.isArray(apiResponse.data)) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(
      `Expected array in data field${errorContext}, but got: ${typeof apiResponse.data}`
    );
  }

  return apiResponse.data as T[];
}

/**
 * Processes a detail response and returns the data object
 * Throws an error if the response format is invalid
 */
export function handleDetailResponse<T>(response: unknown, context?: string): T {
  if (!isValidApiResponse(response)) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(
      `Invalid API response format${errorContext}. Expected { success, message, data, code } but got: ${JSON.stringify(response)}`
    );
  }

  const apiResponse = response as Record<string, unknown>;

  if (!apiResponse.success) {
    throw new Error((apiResponse.message as string) || 'API request failed');
  }

  if (apiResponse.data === null || apiResponse.data === undefined) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(`No data found in response${errorContext}`);
  }

  return apiResponse.data as T;
}

/**
 * Processes a list response and returns the full response with pagination
 * Throws an error if the response format is invalid
 */
export function handlePaginatedResponse<T>(
  response: unknown,
  context?: string
): ApiListResponse<T> {
  if (!isValidApiResponse(response)) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(
      `Invalid API response format${errorContext}. Expected { success, message, data, code } but got: ${JSON.stringify(response)}`
    );
  }

  const apiResponse = response as Record<string, unknown>;

  if (!apiResponse.success) {
    throw new Error((apiResponse.message as string) || 'API request failed');
  }

  if (!Array.isArray(apiResponse.data)) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(
      `Expected array in data field${errorContext}, but got: ${typeof apiResponse.data}`
    );
  }

  if (!apiResponse.pagination) {
    const errorContext = context ? ` (${context})` : '';
    throw new Error(`Missing pagination in list response${errorContext}`);
  }

  return response as ApiListResponse<T>;
}

/**
 * Extracts error messages from an error response
 */
export function extractErrorMessages(error: unknown): string[] {
  if (error && typeof error === 'object' && 'response' in error) {
    const errorResponse = error.response as Record<string, unknown> | undefined;
    if (errorResponse?.data) {
      const errorData = errorResponse.data as Record<string, unknown>;

      // Handle our standard error format
      if (errorData.errors && typeof errorData.errors === 'object') {
        const messages: string[] = [];
        Object.entries(errorData.errors).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            errors.forEach((err) => messages.push(`${field}: ${err}`));
          }
        });
        return messages;
      }

      // Handle message field
      if (errorData.message) {
        return [errorData.message as string];
      }
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return [(error as { message: string }).message || 'An unexpected error occurred'];
  }

  return ['An unexpected error occurred'];
}

// ============================================================================
// Axios Interceptor Helper
// ============================================================================

/**
 * Validates axios response data format
 * Use this as an axios interceptor
 */
export function validateAxiosResponse(response: Record<string, unknown>) {
  const data = response.data;

  // If the response is already in the correct format, return it
  if (isValidApiResponse(data)) {
    return response;
  }

  return response;
}
