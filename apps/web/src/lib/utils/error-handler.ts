/**
 * Error Handling Utilities — Web
 * Re-exports shared error parsing + adds react-hook-form helpers
 */

import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

// Re-export everything from shared package
export {
  parseError,
  getErrorMessage,
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

import { parseError } from '@educard/shared';

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

  Object.entries(normalized.fieldErrors).forEach(([field, message]) => {
    try {
      const formField = (fieldMap?.[field] || field) as Path<TFieldValues>;
      setError(formField, { type: 'manual', message });
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
