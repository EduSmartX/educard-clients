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

/** Extract status code from error data */
function extractStatusCode(
  axiosError: AxiosErrorWrapper,
  errorData: BackendErrorResponse,
): number | undefined {
  if (axiosError.response?.status) {
    return axiosError.response.status;
  }
  return errorData.code;
}

/** Check if errors object has only a detail string and extract it */
function extractDetailFromErrors(
  errors: Record<string, ErrorValue>,
): { detail: string; isOnlyDetail: boolean } | null {
  if (!("detail" in errors) || typeof errors.detail !== "string") {
    return null;
  }
  return {
    detail: errors.detail,
    isOnlyDetail: Object.keys(errors).length === 1,
  };
}

/** Parse DRF-style top-level validation errors (no wrapper "errors" key) */
function parseDrfTopLevelErrors(
  errorData: BackendErrorResponse,
  result: NormalizedError,
): void {
  if (errorData.errors || errorData.detail) {
    return;
  }
  const rawObj = errorData as Record<string, unknown>;
  const hasArrayValues = Object.values(rawObj).some(
    (v) => Array.isArray(v) && v.length > 0 && typeof v[0] === "string",
  );
  if (!hasArrayValues) {
    return;
  }
  result.isValidation = true;
  const flattened = flattenErrors(rawObj as Record<string, ErrorValue>);
  result.fieldErrors = flattened.fieldErrors;
  result.nonFieldErrors = flattened.nonFieldErrors;
}

/** Parse structured errors from backend response */
function parseStructuredErrors(
  errorData: BackendErrorResponse,
  result: NormalizedError,
): boolean {
  if (!errorData.errors || typeof errorData.errors !== "object") {
    return false;
  }

  const errorsObj = errorData.errors as Record<string, ErrorValue>;
  const detailResult = extractDetailFromErrors(errorsObj);
  if (detailResult) {
    result.message = detailResult.detail;
    if (detailResult.isOnlyDetail) {
      return true; // signal early return
    }
  }

  result.isValidation = true;
  const flattened = flattenErrors(errorData.errors);
  result.fieldErrors = flattened.fieldErrors;
  result.nonFieldErrors = flattened.nonFieldErrors;
  return false;
}

/** Apply default messages for validation/failed cases */
function applyDefaultMessages(
  errorData: BackendErrorResponse,
  result: NormalizedError,
): void {
  const isDefaultMessage = result.message === "An unexpected error occurred";

  if (result.isValidation && isDefaultMessage) {
    result.message = "Validation error occurred";
  }

  if (errorData.success === false && isDefaultMessage) {
    result.message = "Request failed";
  }
}

/** Parse object-shaped errors (axios response or backend error) */
function parseObjectError(
  error: object,
  result: NormalizedError,
): NormalizedError {
  const possibleAxiosError = error as AxiosErrorWrapper;
  const possibleBackendError = error as BackendErrorResponse;

  const errorData = possibleAxiosError.response?.data || possibleBackendError;

  result.statusCode = extractStatusCode(possibleAxiosError, errorData);
  result.message = errorData.message || errorData.detail || result.message;

  // Simple detail-only error
  if (errorData.detail && !errorData.errors) {
    result.message = errorData.detail;
    return result;
  }

  // Structured errors from backend
  const shouldReturn = parseStructuredErrors(errorData, result);
  if (shouldReturn) {
    return result;
  }

  // Top-level DRF validation errors
  parseDrfTopLevelErrors(errorData, result);

  // Apply sensible defaults
  applyDefaultMessages(errorData, result);

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

  if (!error) {
    return result;
  }

  if (typeof error === "string") {
    result.message = error;
    return result;
  }

  if (error instanceof Error) {
    if ("response" in error && typeof error === "object") {
      const axiosError = error as AxiosErrorWrapper;
      if (axiosError.response?.data) {
        return parseError(axiosError.response.data);
      }
    }
    result.message = error.message;
    return result;
  }

  if (typeof error === "object") {
    return parseObjectError(error, result);
  }

  return result;
}

/** Get user-friendly error message for display */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const normalized = parseError(error);

  // Priority 1: non-field errors (general validation messages)
  if (normalized.nonFieldErrors.length > 0) {
    return normalized.nonFieldErrors.join("\n");
  }

  // Priority 2: field errors - combine them for user display
  const fieldErrorKeys = Object.keys(normalized.fieldErrors);
  if (fieldErrorKeys.length > 0) {
    // If single field error with descriptive message, return it directly
    if (fieldErrorKeys.length === 1) {
      const msg = normalized.fieldErrors[fieldErrorKeys[0]];
      // If message is long/descriptive, use it directly
      if (msg.length > 50 || msg.includes(".") || msg.includes("!")) {
        return msg;
      }
      // Otherwise include field name
      const fieldLabel = fieldErrorKeys[0]
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${fieldLabel}: ${msg}`;
    }

    // Multiple field errors - combine them
    return fieldErrorKeys
      .map((key) => {
        const msg = normalized.fieldErrors[key];
        if (msg.length > 50 || msg.includes(".") || msg.includes("!")) {
          return msg;
        }
        const fieldLabel = key
          .replaceAll('_', ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${fieldLabel}: ${msg}`;
      })
      .join("\n");
  }

  // Priority 3: message from response (but not generic "Validation error occurred")
  if (
    normalized.message &&
    normalized.message !== "Validation error occurred" &&
    normalized.message !== "An unexpected error occurred"
  ) {
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

  if (!code) {
    return "Error";
  }
  if (code >= 500) {
    return "Server Error";
  }
  if (code === 404) {
    return "Not Found";
  }
  if (code === 403) {
    return "Access Denied";
  }
  if (code === 401) {
    return "Authentication Required";
  }
  if (code === 400 && normalized.isValidation) {
    return "Validation Error";
  }
  if (code >= 400) {
    return "Request Error";
  }

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

/** Format a field name from snake_case to Title Case */
function formatFieldLabel(fieldName: string): string {
  return fieldName.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Check if a message is self-descriptive (long or contains punctuation) */
function isDescriptiveMessage(msg: string): boolean {
  return msg.length > 50 || msg.includes(".") || msg.includes("!");
}

const SKIP_FIELDS = new Set(["has_deleted_duplicate", "deleted_record_id"]);
const NON_FIELD_KEYS = new Set(["non_field_errors", "non_field_error"]);
const META_FIELDS = new Set(["success", "code", "data", "message"]);

/** Process an array field value into error messages */
function processArrayFieldValue(fieldName: string, value: unknown[]): string[] {
  if (value.length === 0) return [];
  if (NON_FIELD_KEYS.has(fieldName)) {
    return value.filter((v) => typeof v === "string") as string[];
  }
  const msg = value[0];
  if (typeof msg === "string") {
    return [
      isDescriptiveMessage(msg)
        ? msg
        : `${formatFieldLabel(fieldName)}: ${msg}`,
    ];
  }
  return [];
}

/** Process a string field value into error messages */
function processStringFieldValue(fieldName: string, value: string): string[] {
  if (NON_FIELD_KEYS.has(fieldName) || fieldName === "detail") {
    return [value];
  }
  return [
    isDescriptiveMessage(value)
      ? value
      : `${formatFieldLabel(fieldName)}: ${value}`,
  ];
}

/** Process a nested object field value into error messages */
function processObjectFieldValue(
  fieldName: string,
  value: Record<string, unknown>,
): string[] {
  const msgs: string[] = [];
  Object.entries(value).forEach(([nestedField, nestedValue]) => {
    if (
      Array.isArray(nestedValue) &&
      nestedValue.length > 0 &&
      typeof nestedValue[0] === "string"
    ) {
      const fullFieldName = `${fieldName}.${nestedField}`;
      msgs.push(`${formatFieldLabel(fullFieldName)}: ${nestedValue[0]}`);
    }
  });
  return msgs;
}

/** Extract error messages from a field errors object */
function extractFieldErrors(errors: Record<string, unknown>): string[] {
  const errorMessages: string[] = [];

  Object.entries(errors).forEach(([fieldName, value]) => {
    if (SKIP_FIELDS.has(fieldName)) return;

    if (Array.isArray(value)) {
      errorMessages.push(...processArrayFieldValue(fieldName, value));
    } else if (typeof value === "string") {
      errorMessages.push(...processStringFieldValue(fieldName, value));
    } else if (typeof value === "object" && value !== null) {
      errorMessages.push(
        ...processObjectFieldValue(fieldName, value as Record<string, unknown>),
      );
    }
  });

  return errorMessages;
}

/** Extract top-level DRF field errors (when no errors/detail/message wrapper) */
function extractTopLevelErrors(rawData: Record<string, unknown>): string[] {
  const topLevelErrors: string[] = [];
  Object.entries(rawData).forEach(([fieldName, value]) => {
    if (SKIP_FIELDS.has(fieldName) || META_FIELDS.has(fieldName)) return;
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string"
    ) {
      if (NON_FIELD_KEYS.has(fieldName)) {
        topLevelErrors.push(...(value as string[]));
      } else {
        topLevelErrors.push(`${formatFieldLabel(fieldName)}: ${value[0]}`);
      }
    } else if (typeof value === "string" && fieldName !== "status_code") {
      topLevelErrors.push(value);
    }
  });
  return topLevelErrors;
}

const GENERIC_MESSAGES = new Set([
  "Validation error occurred",
  "Validation error occurred.",
  "Please check your input and try again.",
  "An unexpected error occurred. Please try again.",
]);

/** Try to extract a non-generic message from data.message */
function extractDataMessage(data: { message?: unknown }): string | null {
  if (
    data.message &&
    typeof data.message === "string" &&
    !GENERIC_MESSAGES.has(data.message)
  ) {
    return data.message;
  }
  return null;
}

/** Try to extract non_field_errors from raw data */
function extractNonFieldErrors(
  rawData: Record<string, unknown>,
): string | null {
  const nfe = rawData.non_field_errors;
  if (Array.isArray(nfe) && nfe.length > 0) {
    return nfe.filter((v: unknown) => typeof v === "string").join("\n");
  }
  if (typeof nfe === "string") {
    return nfe;
  }
  return null;
}

/** Extract error message for display */
export function extractApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  const data = (err as AxiosErrorWrapper)?.response?.data;
  if (!data) {
    return (err as Error)?.message || fallback;
  }

  // Priority 1: Backend sends a specific "message" field
  const directMessage = extractDataMessage(data);
  if (directMessage) return directMessage;

  // Priority 2: Extract from errors object (field-level details)
  if (data.errors && typeof data.errors === "object") {
    const errorMessages = extractFieldErrors(
      data.errors as Record<string, unknown>,
    );
    if (errorMessages.length > 0) return errorMessages.join("\n");
  }

  // Check for top-level DRF validation errors
  const rawData = data as Record<string, unknown>;
  const nfeResult = extractNonFieldErrors(rawData);
  if (nfeResult) return nfeResult;

  // Check for top-level field errors
  if (!data.errors && !data.detail && !data.message) {
    const topLevelErrors = extractTopLevelErrors(rawData);
    if (topLevelErrors.length > 0) return topLevelErrors.join("\n");
  }

  // Check for detail field (common in DRF errors)
  if (data.detail && typeof data.detail === "string") return data.detail;

  return fallback;
}

/** Check if error indicates a deleted duplicate record exists */
export function isDeletedDuplicateError(error: unknown): boolean {
  const axiosError = error as AxiosErrorWrapper;
  const data = axiosError?.response?.data;
  if (!data?.errors) {
    return false;
  }

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

  if (!data?.errors) {
    return fallback;
  }
  const errors = data.errors;

  if (
    Array.isArray(errors.non_field_errors) &&
    errors.non_field_errors.length > 0
  ) {
    return normalize(errors.non_field_errors[0] as string);
  }
  if (typeof errors.non_field_errors === "string") {
    return normalize(errors.non_field_errors);
  }
  if (typeof errors.detail === "string") {
    return normalize(errors.detail);
  }
  if (Array.isArray(errors.detail) && errors.detail.length > 0) {
    return normalize(errors.detail[0] as string);
  }

  return fallback;
}

/** Extract deleted record ID from error */
export function getDeletedRecordId(error: unknown): string | null {
  const errors = (error as AxiosErrorWrapper)?.response?.data?.errors;
  if (!errors) {
    return null;
  }

  if (typeof errors.deleted_record_id === "string") {
    return errors.deleted_record_id;
  }
  if (
    Array.isArray(errors.deleted_record_id) &&
    errors.deleted_record_id.length > 0
  ) {
    return errors.deleted_record_id[0] as string;
  }

  return null;
}
