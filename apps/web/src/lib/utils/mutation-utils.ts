/**
 * Shared Mutation Utilities
 * Reusable types and error handlers for React Query mutations
 */

import { toast } from 'sonner';
import { getErrorMessage, getFieldErrors, isDeletedDuplicateError } from './error-handler';
import { ToastTitles } from '@/constants';

/** Generic field errors — each module can extend this */
export type FieldErrors = Record<string, string | undefined>;

/** Standard mutation options passed to CRUD hooks */
export interface MutationOptions<TFieldErrors extends FieldErrors = FieldErrors> {
  onSuccess?: () => void;
  onError?: (error: Error, fieldErrors?: TFieldErrors) => void;
}

/**
 * Centralized mutation error handler for consistent error display.
 *
 * Behavior:
 *  1. Parses the error into a human-readable message and field-level errors.
 *  2. Shows toast only for non-field errors (server errors, network issues, etc.).
 *  3. Skips toast for deleted duplicate errors (handled with reactivation dialog).
 *  4. Calls the optional `onError` callback so the form can display field errors inline.
 */
export function handleMutationError<TFieldErrors extends FieldErrors = FieldErrors>(
  error: Error,
  fallbackMessage: string,
  onError?: (error: Error, fieldErrors?: TFieldErrors) => void
): void {
  const errorMessage = getErrorMessage(error, fallbackMessage);
  const fieldErrors = getFieldErrors(error) as TFieldErrors | undefined;
  const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;

  // Show toast only when:
  // - Not a deleted duplicate error (those show a reactivation dialog)
  // - No field errors exist (inline field errors are sufficient)
  if (!isDeletedDuplicateError(error) && !hasFieldErrors) {
    toast.error(ToastTitles.ERROR, {
      description: errorMessage,
      duration: 5000,
    });
  }

  onError?.(error, fieldErrors);
}
