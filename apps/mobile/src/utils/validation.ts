/**
 * Form Validation Utilities
 * Reusable validators for mobile forms
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export type FieldErrors = Record<string, string>;

/** Check if a value is present (not empty/null/undefined) */
export const required = (label: string): ValidationRule => ({
  validate: (v) => v !== undefined && v !== null && String(v).trim().length > 0,
  message: `${label} is required`,
});

/** Minimum length */
export const minLength = (label: string, min: number): ValidationRule => ({
  validate: (v) => !v || String(v).trim().length >= min,
  message: `${label} must be at least ${min} characters`,
});

/** Maximum length */
export const maxLength = (label: string, max: number): ValidationRule => ({
  validate: (v) => !v || String(v).trim().length <= max,
  message: `${label} must be less than ${max} characters`,
});

/** Valid email */
export const email = (label = 'Email'): ValidationRule => ({
  validate: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()),
  message: `${label} must be a valid email address`,
});

/** Valid phone (10 digits, optional country code) */
export const phone = (label = 'Phone'): ValidationRule => ({
  validate: (v) => {
    if (!v) return true; // optional by default
    const digits = String(v).replace(/[\s\-\(\)\+]/g, '');
    return /^\d{10,15}$/.test(digits);
  },
  message: `${label} must be a valid phone number (10-15 digits)`,
});

/** Numeric value in range */
export const numberRange = (label: string, min: number, max: number): ValidationRule => ({
  validate: (v) => {
    if (v === undefined || v === null || v === '') return true;
    const n = Number(v);
    return !isNaN(n) && n >= min && n <= max;
  },
  message: `${label} must be between ${min} and ${max}`,
});

/**
 * Validate a form object against a rules map.
 * Returns an errors object (empty = valid).
 */
export function validateForm(
  values: Record<string, any>,
  rulesMap: Record<string, ValidationRule[]>
): FieldErrors {
  const errors: FieldErrors = {};

  for (const [field, rules] of Object.entries(rulesMap)) {
    for (const rule of rules) {
      if (!rule.validate(values[field])) {
        errors[field] = rule.message;
        break; // first error per field
      }
    }
  }

  return errors;
}

/** Quick check if errors object has any */
export const hasErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0;

// ============================================================================
// Date Validation Utilities
// ============================================================================

/**
 * Validate that a start date is not after an end date.
 * Both values should be YYYY-MM-DD strings.
 * Returns an error message string if invalid, or null if valid.
 *
 * @param startDate  - start / from date (YYYY-MM-DD)
 * @param endDate    - end / to date (YYYY-MM-DD)
 * @param startLabel - label for the start field (default "Start date")
 * @param endLabel   - label for the end field (default "End date")
 */
export function validateDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  startLabel = 'Start date',
  endLabel = 'End date'
): string | null {
  if (!startDate || !endDate) return null; // skip if either is empty
  if (startDate > endDate) {
    return `${endLabel} must not be before ${startLabel.toLowerCase()}`;
  }
  return null;
}

/**
 * Add date-range error into a FieldErrors map (mutates in-place).
 * Handy inside validate() callbacks.
 *
 * @param errors     - the errors object to mutate
 * @param startDate  - start date value
 * @param endDate    - end date value
 * @param endField   - field key to attach the error to (default "end_date")
 * @param startLabel - human label for start
 * @param endLabel   - human label for end
 * @returns true if an error was added
 */
export function addDateRangeError(
  errors: FieldErrors,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  endField = 'end_date',
  startLabel = 'Start date',
  endLabel = 'End date'
): boolean {
  const msg = validateDateRange(startDate, endDate, startLabel, endLabel);
  if (msg) {
    errors[endField] = msg;
    return true;
  }
  return false;
}
