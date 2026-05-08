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
 * Handles a mutation error with the standard toast + field-error pattern.
 *
 * Behaviour:
 *  1. Parses the error into a human-readable message and field-level errors.
 *  2. Skips the toast when the error is a "deleted duplicate" (the caller
 *     typically shows a reactivation dialog instead).
 *  3. Calls the optional `onError` callback so the form can display field errors.
 */
export function handleMutationError<TFieldErrors extends FieldErrors = FieldErrors>(
  error: Error,
  fallbackMessage: string,
  onError?: (error: Error, fieldErrors?: TFieldErrors) => void
): void {
  const errorMessage = getErrorMessage(error, fallbackMessage);
  const fieldErrors = getFieldErrors(error) as TFieldErrors | undefined;

  if (!isDeletedDuplicateError(error)) {
    toast.error(ToastTitles.ERROR, {
      description: errorMessage,
      duration: 5000,
    });
  }

  onError?.(error, fieldErrors);
}
