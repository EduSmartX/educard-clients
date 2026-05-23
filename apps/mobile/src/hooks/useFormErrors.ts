/**
 * useFormErrors - Hook for managing form field errors
 * Handles both client-side validation and server-side API errors
 */

import { extractApiError, getFieldErrors } from '@educard/shared';
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export type FormErrors = Record<string, string>;

interface UseFormErrorsOptions {
  /** Show alert popup for non-field errors */
  showAlert?: boolean;
  /** Custom field name mapping (backend field name -> form field name) */
  fieldMap?: Record<string, string>;
}

interface UseFormErrorsReturn {
  /** Current field errors */
  errors: FormErrors;
  /** Set error for a specific field */
  setFieldError: (field: string, message: string) => void;
  /** Clear error for a specific field */
  clearFieldError: (field: string) => void;
  /** Clear all errors */
  clearAllErrors: () => void;
  /** Get error for a specific field */
  getError: (field: string) => string | undefined;
  /** Check if a field has an error */
  hasError: (field: string) => boolean;
  /** Check if any errors exist */
  hasAnyError: () => boolean;
  /** Handle API error response - sets field errors and shows alert for non-field errors */
  handleApiError: (error: unknown, fallbackMessage?: string) => void;
  /** Validate required fields - returns true if all valid */
  validateRequired: (
    fields: { name: string; value: string | undefined; label: string }[]
  ) => boolean;
}

/**
 * Hook for managing form field errors with API error handling
 *
 * @example
 * ```tsx
 * const { errors, setFieldError, handleApiError, validateRequired } = useFormErrors();
 *
 * // Client-side validation
 * const handleSubmit = () => {
 *   const isValid = validateRequired([
 *     { name: 'title', value: title, label: 'Title' },
 *     { name: 'subject_public_id', value: selectedSubject, label: 'Subject' },
 *   ]);
 *   if (!isValid) return;
 *
 *   createMutation.mutate(payload, {
 *     onError: (error) => handleApiError(error, 'Failed to create homework'),
 *   });
 * };
 *
 * // In form
 * <FormInput
 *   label="Title"
 *   value={title}
 *   onChangeText={(text) => { setTitle(text); clearFieldError('title'); }}
 *   error={errors.title}
 *   required
 * />
 * ```
 */
export function useFormErrors(options: UseFormErrorsOptions = {}): UseFormErrorsReturn {
  const { showAlert = true, fieldMap = {} } = options;
  const [errors, setErrors] = useState<FormErrors>({});

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getError = useCallback(
    (field: string): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  const hasError = useCallback(
    (field: string): boolean => {
      return !!errors[field];
    },
    [errors]
  );

  const hasAnyError = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  const handleApiError = useCallback(
    (error: unknown, fallbackMessage = 'An error occurred') => {
      // Extract field-specific errors from the API response
      const fieldErrors = getFieldErrors(error);

      // Map backend field names to form field names if mapping provided
      const mappedErrors: FormErrors = {};
      let hasFieldErrors = false;

      Object.entries(fieldErrors).forEach(([backendField, message]) => {
        const formField = fieldMap[backendField] || backendField;
        mappedErrors[formField] = message;
        hasFieldErrors = true;
      });

      // Set field errors for inline display
      if (hasFieldErrors) {
        setErrors((prev) => ({ ...prev, ...mappedErrors }));
        // Inline field errors are sufficient - no alert needed
        return;
      }

      // Show alert only for non-field errors (server errors, network issues, etc.)
      if (showAlert) {
        const alertMessage = extractApiError(error, fallbackMessage);
        Alert.alert('Error', alertMessage);
      }
    },
    [fieldMap, showAlert]
  );

  const validateRequired = useCallback(
    (fields: { name: string; value: string | undefined; label: string }[]): boolean => {
      let isValid = true;
      const newErrors: FormErrors = {};

      fields.forEach(({ name, value, label }) => {
        if (!value || !value.trim()) {
          newErrors[name] = `${label} is required`;
          isValid = false;
        }
      });

      if (!isValid) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        if (showAlert) {
          Alert.alert('Validation Error', 'Please fill in all required fields');
        }
      }

      return isValid;
    },
    [showAlert]
  );

  return {
    errors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    getError,
    hasError,
    hasAnyError,
    handleApiError,
    validateRequired,
  };
}
