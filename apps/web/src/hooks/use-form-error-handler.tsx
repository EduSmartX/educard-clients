/**
 * Reusable hook for handling form errors consistently across the application
 * Automatically handles both field-level and non-field errors from backend
 */

import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { type UseFormSetError, type FieldValues } from 'react-hook-form';
import { applyFieldErrors, getErrorMessage } from '@/lib/utils/error-handler';
import { ErrorMessages, ToastTitles } from '@/constants';

interface UseFormErrorHandlerOptions {
  /**
   * Default error message when no specific error is found
   */
  defaultErrorMessage?: string;

  /**
   * Custom field name mapping (backend field name -> form field name)
   */
  fieldMap?: Record<string, string>;

  /**
   * Whether to show toast notifications for errors
   * @default true
   */
  showToast?: boolean;

  /**
   * Toast duration in milliseconds
   * @default 5000
   */
  toastDuration?: number;

  /**
   * Custom toast title for validation errors
   * @default "Validation Error"
   */
  validationErrorTitle?: string;

  /**
   * Custom toast title for general errors
   * @default "Error"
   */
  generalErrorTitle?: string;
}

/**
 * Hook to handle form errors consistently
 *
 * @example
 * ```tsx
 * const handleError = useFormErrorHandler(form.setError, {
 *   defaultErrorMessage: 'Failed to create leave allocation',
 *   fieldMap: { backend_field: 'frontendField' },
 * });
 *
 * // In mutation onError:
 * onError: (error) => {
 *   handleError(error);
 * }
 * ```
 */
export function useFormErrorHandler<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
  options: UseFormErrorHandlerOptions = {}
) {
  const {
    defaultErrorMessage = ErrorMessages.GENERIC_ERROR,
    fieldMap,
    showToast = true,
    toastDuration = 5000,
    validationErrorTitle = ToastTitles.VALIDATION_ERROR,
    generalErrorTitle = ToastTitles.ERROR,
  } = options;

  return (error: unknown) => {
    // Apply field errors to form and get toast message
    const result = applyFieldErrors(error, setError, fieldMap);

    if (!showToast) {
      return result;
    }

    // Show toast with appropriate message
    if (result.toastMessage) {
      const title = result.hasFieldErrors ? validationErrorTitle : generalErrorTitle;

      toast.error(title, {
        description: result.toastMessage || getErrorMessage(error, defaultErrorMessage),
        icon: <AlertCircle className="h-4 w-4" />,
        duration: toastDuration,
      });
    }

    return result;
  };
}

/**
 * Simplified version that just handles errors without requiring form setup
 * Useful for non-form API calls
 */
export function useApiErrorHandler(options: Omit<UseFormErrorHandlerOptions, 'fieldMap'> = {}) {
  const {
    defaultErrorMessage = ErrorMessages.GENERIC_ERROR,
    showToast = true,
    toastDuration = 5000,
    generalErrorTitle = ToastTitles.ERROR,
  } = options;

  return (error: unknown) => {
    if (!showToast) {
      return;
    }

    const errorMessage = getErrorMessage(error, defaultErrorMessage);
    toast.error(generalErrorTitle, {
      description: errorMessage,
      icon: <AlertCircle className="h-4 w-4" />,
      duration: toastDuration,
    });
  };
}
