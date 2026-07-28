/**
 * Shared Mutation Utilities for Mobile
 * Reusable error handler for React Query mutations.
 */

import {
  isDeletedDuplicateError,
  parseError,
  type NormalizedError,
} from '@educard/shared';

import { showToast } from '@/utils/toast';

/** Standard mutation options passed to CRUD hooks */
export interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown, fieldErrors?: Record<string, string>) => void;
}

/**
 * Centralized mutation error handler for mobile.
 */
export function handleMutationError(
  error: unknown,
  fallbackMessage: string,
  onError?: (error: unknown, fieldErrors?: Record<string, string>) => void,
): void {
  // Skip toast for deleted duplicate errors — handled by reactivation dialog
  if (isDeletedDuplicateError(error)) {
    onError?.(error, undefined);
    return;
  }

  const parsed: NormalizedError = parseError(error);
  const hasNonField = parsed.nonFieldErrors.length > 0;
  const hasFieldErrors = Object.keys(parsed.fieldErrors).length > 0;

  if (hasNonField) {
    showToast('error', parsed.nonFieldErrors.join('\n'));
  }

  if (hasFieldErrors) {
    const fieldMessages = Object.entries(parsed.fieldErrors)
      .map(([field, msg]) => {
        const label = field
          .replaceAll('_', ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        return `${label}: ${msg}`;
      })
      .join('\n');
    showToast('error', fieldMessages);
  }

  if (!hasNonField && !hasFieldErrors) {
    const message =
      parsed.message !== 'An unexpected error occurred' &&
      parsed.message !== 'Validation error occurred'
        ? parsed.message
        : fallbackMessage;
    showToast('error', message);
  }

  onError?.(error, hasFieldErrors ? parsed.fieldErrors : undefined);
}
