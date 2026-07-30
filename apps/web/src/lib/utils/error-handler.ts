/**
 * Error Handling Utilities — Web
 * Re-exports shared error parsing + adds react-hook-form helpers
 */

import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

// Re-export everything from shared package
export {
  parseError,
  getFieldErrors,
  getNonFieldErrors,
  isValidationError,
  isNetworkError,
  getErrorTitle,
  parseApiError,
  extractApiError,
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@educard/shared';
export type { NormalizedError } from '@educard/shared';

import {
  parseError,
  getErrorMessage as sharedGetErrorMessage,
  isNetworkError,
} from '@educard/shared';

/**
 * Shown when the browser gets no usable response — axios "Network Error" (no
 * response received) or a client timeout. The request can still have reached the
 * server (e.g. a delete that succeeded) while the response was lost, so we ask the
 * user to refresh instead of asserting failure with the raw, misleading text.
 */
const NO_RESPONSE_MESSAGE =
  "The server didn't respond, so the result couldn't be confirmed. Please refresh — your change may already be applied.";

/** True for no-response failures: network errors and client timeouts. */
function isNoResponseError(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true;
  }
  return error instanceof Error && error.message.toLowerCase().includes('timeout');
}

/**
 * User-friendly error message. Overrides the shared version so a no-response
 * failure returns an honest "refresh to confirm" message rather than the raw
 * "Network Error"/timeout text, which was confusing when the action succeeded.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (isNoResponseError(error)) {
    return NO_RESPONSE_MESSAGE;
  }
  return sharedGetErrorMessage(error, fallback);
}

function getFieldCandidates(field: string, fieldMap?: Record<string, string>): string[] {
  const explicit = fieldMap?.[field];
  if (explicit) {
    return [explicit];
  }

  const normalized = field.replace(/\[(\d+)\]/g, '.$1');
  const leaf = normalized.split('.').pop() || normalized;

  const candidates = [normalized];
  if (leaf !== normalized) {
    candidates.push(leaf);
  }

  return [...new Set(candidates)];
}

/**
 * Apply field errors to react-hook-form.
 * Sets errors on form fields and returns summary for toast.
 */
export function applyFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldMap?: Record<string, string>
): {
  hasFieldErrors: boolean;
  fieldErrorCount: number;
  toastMessage: string;
  fieldErrorMessages: string[];
} {
  const normalized = parseError(error);
  const result = {
    hasFieldErrors: false,
    fieldErrorCount: 0,
    toastMessage: '',
    fieldErrorMessages: [] as string[],
  };

  const parsedFieldErrors = normalized.fieldErrors as Record<string, string>;

  Object.entries(parsedFieldErrors).forEach(([field, message]) => {
    try {
      const candidates = getFieldCandidates(field, fieldMap);
      candidates.forEach((candidate) => {
        setError(candidate as Path<TFieldValues>, { type: 'manual', message });
      });
      result.hasFieldErrors = true;
      result.fieldErrorCount++;
      result.fieldErrorMessages.push(message);
    } catch {
      normalized.nonFieldErrors.push(`${field}: ${message}`);
    }
  });

  if (normalized.nonFieldErrors.length > 0) {
    result.toastMessage = normalized.nonFieldErrors[0];
  } else if (result.hasFieldErrors) {
    result.toastMessage = normalized.message || 'Please check the form fields for errors';
  } else {
    result.toastMessage = normalized.message;
  }

  return result;
}

/** @deprecated Use applyFieldErrors() instead */
export function setFormFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  fieldMap?: Record<string, Path<TFieldValues>>
): {
  hasFieldError: boolean;
  fieldErrors: string[];
  nonFieldErrors: string[];
  allErrors: string[];
  shouldShowToast: boolean;
} {
  const result = applyFieldErrors(error, setError, fieldMap);
  const normalized = parseError(error);
  return {
    hasFieldError: result.hasFieldErrors,
    fieldErrors: result.fieldErrorMessages,
    nonFieldErrors: normalized.nonFieldErrors,
    allErrors: [...result.fieldErrorMessages, ...normalized.nonFieldErrors],
    shouldShowToast: result.hasFieldErrors || normalized.nonFieldErrors.length > 0,
  };
}

/** @deprecated Use getFieldErrors() instead */
export function extractFieldErrors(error: unknown): Record<string, string> {
  return parseError(error).fieldErrors;
}

/** @deprecated Use parseError() instead */
export function extractValidationErrors(error: unknown): {
  fieldErrors: Record<string, string>;
  nonFieldErrors: string[];
  message: string;
} {
  const normalized = parseError(error);
  return {
    fieldErrors: normalized.fieldErrors,
    nonFieldErrors: normalized.nonFieldErrors,
    message: normalized.message,
  };
}
