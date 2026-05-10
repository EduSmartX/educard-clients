/**
 * Error Handling Utilities
 * Handles Django REST Framework error responses with nested structures
 */

import type { ApiError } from "../types/api";

/** Backend error response structure */
export interface BackendErrorResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: unknown;
  errors?: Record<string, ErrorValue>;
  code?: number;
  detail?: string;
}

/** Axios error wrapper */
export interface AxiosErrorWrapper {
  response?: {
    data?: BackendErrorResponse;
    status?: number;
  };
  message?: string;
}

export type ErrorValue = string | string[] | Record<string, string | string[]>;

/** Normalized error model */
export interface NormalizedError {
  message: string;
  fieldErrors: Record<string, string>;
  nonFieldErrors: string[];
  statusCode?: number;
  isValidation: boolean;
}

/** Recursively flatten nested error objects */
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

/** Parse any error into normalized structure */
export function parseError(error: unknown): NormalizedError {
  const result: NormalizedError = {
    message: "An unexpected error occurred",
    fieldErrors: {},
    nonFieldErrors: [],
    isValidation: false,
  };

  // Handle null/undefined
  if (!error) {return result;}

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

/** Get user-friendly error message for display */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const normalized = parseError(error);

  // Priority 1: non-field errors (general validation messages)
  if (normalized.nonFieldErrors.length > 0) {
    return normalized.nonFieldErrors.join('\n');
  }

  // Priority 2: field errors - combine them for user display
  const fieldErrorKeys = Object.keys(normalized.fieldErrors);
  if (fieldErrorKeys.length > 0) {
    // If single field error with descriptive message, return it directly
    if (fieldErrorKeys.length === 1) {
      const msg = normalized.fieldErrors[fieldErrorKeys[0]];
      // If message is long/descriptive, use it directly
      if (msg.length > 50 || msg.includes('.') || msg.includes('!')) {
        return msg;
      }
      // Otherwise include field name
      const fieldLabel = fieldErrorKeys[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${fieldLabel}: ${msg}`;
    }
    
    // Multiple field errors - combine them
    return fieldErrorKeys.map(key => {
      const msg = normalized.fieldErrors[key];
      if (msg.length > 50 || msg.includes('.') || msg.includes('!')) {
        return msg;
      }
      const fieldLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${fieldLabel}: ${msg}`;
    }).join('\n');
  }

  // Priority 3: message from response (but not generic "Validation error occurred")
  if (normalized.message && 
      normalized.message !== "Validation error occurred" && 
      normalized.message !== "An unexpected error occurred") {
    return normalized.message;
  }

  return fallback || "An unexpected error occurred";
}

/** Get field errors for form validation */
export function getFieldErrors(error: unknown): Record<string, string> {
  return parseError(error).fieldErrors;
}

/** Get non-field errors */
export function getNonFieldErrors(error: unknown): string[] {
  return parseError(error).nonFieldErrors;
}

/** Check if error is a validation error */
export function isValidationError(error: unknown): boolean {
  return parseError(error).isValidation;
}

/** Check if error is a network error */
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

/** Get error title based on status code */
export function getErrorTitle(error: unknown): string {
  const normalized = parseError(error);
  const code = normalized.statusCode;

  if (!code) {return "Error";}
  if (code >= 500) {return "Server Error";}
  if (code === 404) {return "Not Found";}
  if (code === 403) {return "Access Denied";}
  if (code === 401) {return "Authentication Required";}
  if (code === 400 && normalized.isValidation) {return "Validation Error";}
  if (code >= 400) {return "Request Error";}

  return "Error";
}

/** @deprecated Use parseError() instead */
export function parseApiError(error: unknown): ApiError {
  const normalized = parseError(error);
  return {
    status: normalized.statusCode ?? 500,
    message: getErrorMessage(error),
    errors: normalized.fieldErrors,
  };
}

/** Extract error message for display */
export function extractApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  const data = (err as AxiosErrorWrapper)?.response?.data;
  if (!data) {return (err as Error)?.message || fallback;}

  // First check for errors object (Django validation errors)
  if (data.errors && typeof data.errors === "object") {
    const errorMessages: string[] = [];
    
    Object.entries(data.errors).forEach(([fieldName, value]) => {
      // Skip internal flags
      if (fieldName === 'has_deleted_duplicate' || fieldName === 'deleted_record_id') {
        return;
      }
      
      // Handle array of error messages
      if (Array.isArray(value) && value.length > 0) {
        // For non_field_errors, add directly
        if (fieldName === 'non_field_errors' || fieldName === 'non_field_error') {
          errorMessages.push(...value.filter(v => typeof v === 'string'));
        } else {
          // For field errors, check if message is already descriptive
          const msg = value[0];
          if (typeof msg === 'string') {
            // If message is already descriptive (long sentence), use it directly
            if (msg.length > 50 || msg.includes('.') || msg.includes('!')) {
              errorMessages.push(msg);
            } else {
              // Convert snake_case to Title Case for short messages
              const fieldLabel = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              errorMessages.push(`${fieldLabel}: ${msg}`);
            }
          }
        }
      } else if (typeof value === 'string') {
        if (fieldName === 'non_field_errors' || fieldName === 'non_field_error' || fieldName === 'detail') {
          errorMessages.push(value);
        } else {
          const fieldLabel = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          errorMessages.push(`${fieldLabel}: ${value}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested errors (e.g., student_data.email)
        Object.entries(value as Record<string, unknown>).forEach(([nestedField, nestedValue]) => {
          if (Array.isArray(nestedValue) && nestedValue.length > 0 && typeof nestedValue[0] === 'string') {
            const fieldLabel = `${fieldName}.${nestedField}`.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            errorMessages.push(`${fieldLabel}: ${nestedValue[0]}`);
          }
        });
      }
    });
    
    if (errorMessages.length > 0) {
      return errorMessages.join('\n');
    }
  }

  // Check for detail field (common in DRF errors)
  if (data.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // Check for message field (our custom response format)
  if (data.message && typeof data.message === 'string') {
    // Don't return generic validation message if we couldn't extract specific errors
    if (data.message !== 'Validation error occurred' && data.message !== 'Validation error occurred.') {
      return data.message;
    }
  }

  return fallback;
}

/** Check if error indicates a deleted duplicate record exists */
export function isDeletedDuplicateError(error: unknown): boolean {
  const axiosError = error as AxiosErrorWrapper;
  const data = axiosError?.response?.data;
  if (!data?.errors) {return false;}

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

/** Extract user-friendly message from deleted duplicate error */
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

  if (!data?.errors) {return fallback;}
  const errors = data.errors;

  if (Array.isArray(errors.non_field_errors) && errors.non_field_errors.length > 0)
    {return normalize(errors.non_field_errors[0] as string);}
  if (typeof errors.non_field_errors === "string")
    {return normalize(errors.non_field_errors);}
  if (typeof errors.detail === "string") {return normalize(errors.detail);}
  if (Array.isArray(errors.detail) && errors.detail.length > 0)
    {return normalize(errors.detail[0] as string);}

  return fallback;
}

/** Extract deleted record ID from error */
export function getDeletedRecordId(error: unknown): string | null {
  const errors = (error as AxiosErrorWrapper)?.response?.data?.errors;
  if (!errors) {return null;}

  if (typeof errors.deleted_record_id === "string") {return errors.deleted_record_id;}
  if (Array.isArray(errors.deleted_record_id) && errors.deleted_record_id.length > 0)
    {return errors.deleted_record_id[0] as string;}

  return null;
}
