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
