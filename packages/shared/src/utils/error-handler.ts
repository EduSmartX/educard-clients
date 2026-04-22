/**
 * Error Handling Utilities
 * Single-pass parsing with normalized error model
 * Handles Django REST Framework error responses with nested structures
 * Shared across Web, iOS, and Android
 */

// Import ApiError type from types module
import type { ApiError } from "../types/api";

// ============================================================================
// Types
// ============================================================================

/**
 * Backend error response structure (what Django sends in response.data)
 */
export interface BackendErrorResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: unknown;
  errors?: Record<string, ErrorValue>;
  code?: number;
  detail?: string;
}

/**
 * Axios error wrapper (what we receive in catch block)
 */
export interface AxiosErrorWrapper {
  response?: {
    data?: BackendErrorResponse;
    status?: number;
  };
  message?: string;
}

/**
 * Error values in the errors object can be:
 * - string[] (field error array)
 * - string (single error)
 * - nested object (for nested structures like student_data.email)
 */
export type ErrorValue = string | string[] | Record<string, string | string[]>;

/**
 * Normalized error model - single source of truth
 */
export interface NormalizedError {
  message: string;
  fieldErrors: Record<string, string>;
  nonFieldErrors: string[];
  statusCode?: number;
  isValidation: boolean;
}

// ============================================================================
// Core Parser - Parse Once, Use Everywhere
// ============================================================================

/**
 * Recursively flatten nested error objects
 * Handles cases like: { student_data: { email: ["error"] } }
 * Returns: { "student_data.email": "error" }
 */
function flattenErrors(
  errors: Record<string, ErrorValue>,
  prefix = "",
): { fieldErrors: Record<string, string>; nonFieldErrors: string[] } {
  const result = {
    fieldErrors: {} as Record<string, string>,
    nonFieldErrors: [] as string[],
  };

  Object.entries(errors).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Check if this is a non-field error key
    if (key === "non_field_errors" || key === "non_field_error") {
      if (Array.isArray(value)) {
        result.nonFieldErrors.push(...(value as string[]));
      } else if (typeof value === "string") {
        result.nonFieldErrors.push(value);
      }
      return;
    }

    // Handle array of strings (simple field error)
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "string") {
        result.fieldErrors[fullKey] = value[0];
      }
      return;
    }

    // Handle single string
    if (typeof value === "string") {
      result.fieldErrors[fullKey] = value;
      return;
    }

    // Handle nested object (recurse)
    if (typeof value === "object" && value !== null) {
      const nested = flattenErrors(
        value as Record<string, ErrorValue>,
        fullKey,
      );
      Object.assign(result.fieldErrors, nested.fieldErrors);
      result.nonFieldErrors.push(...nested.nonFieldErrors);
    }
  });

  return result;
}

/**
 * Parse any error into normalized structure
 * This is the ONLY function that touches raw errors
 * All other functions consume NormalizedError
 */
export function parseError(error: unknown): NormalizedError {
  const result: NormalizedError = {
    message: "An unexpected error occurred",
    fieldErrors: {},
    nonFieldErrors: [],
    isValidation: false,
  };

  // Handle null/undefined
  if (!error) return result;

  // Handle string errors
  if (typeof error === "string") {
    result.message = error;
    return result;
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Check if it's an axios error with response data
    if ("response" in error && typeof error === "object") {
      const axiosError = error as AxiosErrorWrapper;
      if (axiosError.response?.data) {
        return parseError(axiosError.response.data);
      }
    }
    result.message = error.message;
    return result;
  }

  // Handle object errors (axios response or backend error)
  if (typeof error === "object") {
    const possibleAxiosError = error as AxiosErrorWrapper;
    const possibleBackendError = error as BackendErrorResponse;

    // If it has response.data, it's an axios wrapper
    const errorData = possibleAxiosError.response?.data || possibleBackendError;

    // Get status code
    if (possibleAxiosError.response?.status) {
      result.statusCode = possibleAxiosError.response.status;
    } else if (errorData.code) {
      result.statusCode = errorData.code;
    }

    // Extract main message
    result.message = errorData.message || errorData.detail || result.message;

    // Check for simple detail-only errors
    if (errorData.detail && !errorData.errors) {
      result.message = errorData.detail;
      return result;
    }

    // Check if errors object contains a detail field
    if (errorData.errors && typeof errorData.errors === "object") {
      const errorsObj = errorData.errors as Record<string, ErrorValue>;
      if ("detail" in errorsObj && typeof errorsObj.detail === "string") {
        result.message = errorsObj.detail;
        if (Object.keys(errorsObj).length === 1) {
          return result;
        }
      }
    }

    // Parse errors object (supports nested structures)
    if (errorData.errors && typeof errorData.errors === "object") {
      result.isValidation = true;
      const flattened = flattenErrors(errorData.errors);
      result.fieldErrors = flattened.fieldErrors;
      result.nonFieldErrors = flattened.nonFieldErrors;
    }

    // If we have validation errors but no message, set a better default
    if (
      result.isValidation &&
      result.message === "An unexpected error occurred"
    ) {
      result.message = "Validation error occurred";
    }

    // Special case: If success=false but no other message
    if (
      errorData.success === false &&
      result.message === "An unexpected error occurred"
    ) {
      result.message = "Request failed";
    }
  }

  return result;
}

// ============================================================================
// Public API - All functions consume NormalizedError
// ============================================================================

/**
 * Get user-friendly error message for display
 * Use this for toast messages
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const normalized = parseError(error);

  // Priority: non-field errors > single field error > message > fallback
  if (normalized.nonFieldErrors.length > 0) {
    return normalized.nonFieldErrors[0];
  }

  const fieldErrorKeys = Object.keys(normalized.fieldErrors);
  if (fieldErrorKeys.length === 1) {
    return normalized.fieldErrors[fieldErrorKeys[0]];
  }

  return normalized.message || fallback || "An unexpected error occurred";
}

/**
 * Get field errors without form library
 * Use for vanilla state management (React Native)
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const normalized = parseError(error);
  return normalized.fieldErrors;
}

/**
 * Get non-field errors
 * Use when you need just the general validation errors
 */
export function getNonFieldErrors(error: unknown): string[] {
  const normalized = parseError(error);
  return normalized.nonFieldErrors;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const normalized = parseError(error);
  return normalized.isValidation;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("connection")
    );
  }
  return false;
}

/**
 * Get error title based on status code
 */
export function getErrorTitle(error: unknown): string {
  const normalized = parseError(error);
  const code = normalized.statusCode;

  if (!code) return "Error";
  if (code >= 500) return "Server Error";
  if (code === 404) return "Not Found";
  if (code === 403) return "Access Denied";
  if (code === 401) return "Authentication Required";
  if (code === 400 && normalized.isValidation) return "Validation Error";
  if (code >= 400) return "Request Error";

  return "Error";
}

/**
 * Convert error to ApiError format (backward compatibility)
 * @deprecated Use parseError() for full error details
 */
export function parseApiError(error: unknown): ApiError {
  const normalized = parseError(error);
  return {
    status: normalized.statusCode ?? 500,
    message: getErrorMessage(error),
    errors: normalized.fieldErrors,
  };
}
