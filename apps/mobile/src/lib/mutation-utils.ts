/**
 * Shared Mutation Utilities for Mobile
 * Reusable error handler for React Query mutations.
 * Shows toast for non-field errors + passes field errors for form display.
 */

import { isDeletedDuplicateError, parseError, type NormalizedError } from '@educard/shared';

import { showToast } from '@/utils/toast';

/** Standard mutation options passed to CRUD hooks */
export interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown, fieldErrors?: Record<string, string>) => void;
}

/**
 * Centralized mutation error handler for mobile.
 *
 * Behavior:
 *  1. Skips toast for deleted duplicate errors (handled by reactivation dialog).
 *  2. Parses the error into non-field errors + field-level errors.
 *  3. Shows toast for non-field errors.
 *  4. Shows toast for field errors (mobile users need visibility).
 *  5. Calls `onError` callback so forms can display field errors inline.
 */
export function handleMutationError(
  error: unknown,
  fallbackMessage: string,
  onError?: (error: unknown, fieldErrors?: Record<string, string>) => void
): void {
  // Skip toast for deleted duplicate errors — handled by reactivation dialog
  if (isDeletedDuplicateError(error)) {
    onError?.(error, undefined);
    return;
  }

  const parsed: NormalizedError = parseError(error);
  const hasNonField = parsed.nonFieldErrors.length > 0;
  const hasFieldErrors = Object.keys(parsed.fieldErrors).length > 0;

  // Show non-field errors as toast
  if (hasNonField) {
    showToast('error', parsed.nonFieldErrors.join('\n'));
  }

  // Field errors: show as toast AND pass to callback for form display
  if (hasFieldErrors) {
    const fieldMessages = Object.entries(parsed.fieldErrors)
      .map(([field, msg]) => {
        const label = field.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return `${label}: ${msg}`;
      })
      .join('\n');
    showToast('error', fieldMessages);
  }

  // If no specific errors found, show generic message
  if (!hasNonField && !hasFieldErrors) {
    const message =
      parsed.message !== 'An unexpected error occurred' &&
      parsed.message !== 'Validation error occurred'
        ? parsed.message
        : fallbackMessage;
    showToast('error', message);
  }

  // Always call onError with field errors so forms can display inline
  onError?.(error, hasFieldErrors ? parsed.fieldErrors : undefined);
}
