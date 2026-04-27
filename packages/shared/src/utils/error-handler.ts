/**
 * Error Handling Utilities
 * Single-pass parsing with normalized error model
 * Handles Django REST Framework error responses with nested structures
 * Shared across Web, iOS, and Android
 */

import type { ApiError } from "../types/api";

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

/**
 * Quick one-liner error extraction for Alert/toast messages.
 * Handles Django custom exception handler format: { status, message, errors, code }
 */
export function extractApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  const data = (err as AxiosErrorWrapper)?.response?.data;
  if (!data) return (err as Error)?.message || fallback;

  if (data.errors && typeof data.errors === "object") {
    const msgs = Object.entries(data.errors)
      .map(([, v]) =>
        Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "",
      )
      .filter(Boolean);
    if (msgs.length > 0) return msgs.join("\n");
  }

  if (data.detail && typeof data.detail === "string") return data.detail;
  if (data.message && data.message !== "Validation error occurred")
    return data.message;

  return fallback;
}

/**
 * Check if error indicates a deleted duplicate record exists
 */
export function isDeletedDuplicateError(error: unknown): boolean {
  const axiosError = error as AxiosErrorWrapper;
  const data = axiosError?.response?.data;
  if (!data?.errors) return false;

  const hasDuplicate = data.errors.has_deleted_duplicate;
  if (
    hasDuplicate === "true" ||
    hasDuplicate === "True" ||
    (Array.isArray(hasDuplicate) &&
      hasDuplicate.length > 0 &&
      (hasDuplicate[0] === "True" || hasDuplicate[0] === "true"))
  ) {
    return true;
  }
  return false;
}

/**
 * Extract user-friendly message from deleted duplicate error
 */
export function getDeletedDuplicateMessage(error: unknown): string {
  const data = (error as AxiosErrorWrapper)?.response?.data;
  const fallback =
    "A deleted record with the same details already exists. You can modify here, or go to 'View Deleted' to restore it.";

  const normalize = (msg: string) =>
    msg
      .replace(
        /Please navigate to 'View Deleted' to restore it, or do you need to create a new ([^?]+)\?/i,
        "You can modify here, or go to 'View Deleted' to restore it. Do you want to create a new $1?",
      )
      .replace(
        /Please navigate to 'View Deleted' to restore it\.?/i,
        "You can modify here, or go to 'View Deleted' to restore it.",
      );

  if (!data?.errors) return fallback;
  const errors = data.errors;

  if (Array.isArray(errors.non_field_errors) && errors.non_field_errors.length > 0)
    return normalize(errors.non_field_errors[0] as string);
  if (typeof errors.non_field_errors === "string")
    return normalize(errors.non_field_errors);
  if (typeof errors.detail === "string") return normalize(errors.detail);
  if (Array.isArray(errors.detail) && errors.detail.length > 0)
    return normalize(errors.detail[0] as string);

  return fallback;
}

/**
 * Extract deleted record ID from deleted duplicate error
 */
export function getDeletedRecordId(error: unknown): string | null {
  const errors = (error as AxiosErrorWrapper)?.response?.data?.errors;
  if (!errors) return null;

  if (typeof errors.deleted_record_id === "string") return errors.deleted_record_id;
  if (Array.isArray(errors.deleted_record_id) && errors.deleted_record_id.length > 0)
    return errors.deleted_record_id[0] as string;

  return null;
}
