/**
 * Shared Zod Validation Helpers
 * Reusable Zod schemas based on existing field-validators.ts
 * Use these validators across all forms for consistency
 */

import { z } from 'zod';

export const PHONE_REGEX = /^\d{10}$/;
export const EMPLOYEE_ID_REGEX = /^[A-Z0-9_-]+$/i;
export const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const emailSchema = (required = true) => {
  const base = z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters')
    .transform((val) => val.trim().toLowerCase());

  if (required) {
    return z.string().min(1, 'Email is required').pipe(base);
  }
  return base.optional().or(z.literal(''));
};

export const phoneSchema = (required = false) => {
  const validator = z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const cleaned = cleanPhoneNumber(val);
        return PHONE_REGEX.test(cleaned);
      },
      { message: 'Phone number must be 10 digits' }
    )
    .transform((val) => (val ? cleanPhoneNumber(val) : undefined));

  return required ? validator : validator.optional();
};

export const nameSchema = (fieldName: string, required = true, minLength = 2, maxLength = 100) => {
  const base = z
    .string()
    .max(maxLength, `${fieldName} must not exceed ${maxLength} characters`)
    .regex(NAME_REGEX, `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`)
    .transform((val) => val.trim());

  if (required) {
    return z
      .string()
      .min(1, `${fieldName} is required`)
      .min(minLength, `${fieldName} must be at least ${minLength} characters`)
      .pipe(base);
  }
  return base.optional();
};

export const employeeIdSchema = (required = true, maxLength = 50) => {
  const base = z
    .string()
    .max(maxLength, `Employee ID must not exceed ${maxLength} characters`)
    .regex(
      EMPLOYEE_ID_REGEX,
      'Employee ID can only contain letters, numbers, hyphens, and underscores'
    )
    .transform((val) => val.trim().toUpperCase());

  if (required) {
    return z.string().min(1, 'Employee ID is required').pipe(base);
  }
  return base.optional();
};

export const dateSchema = (fieldName: string, required = false) => {
  const validator = z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: `Please enter a valid ${fieldName.toLowerCase()}`,
  });

  return required ? validator : validator.optional();
};

export const numberSchema = (
  fieldName: string,
  options: { required?: boolean; min?: number; max?: number; integer?: boolean } = {}
) => {
  const { required = false, min, max, integer = true } = options;

  const validator = z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (!val) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .refine(
      (val) => {
        if (val === undefined) return true;
        if (integer && !Number.isInteger(val)) return false;
        if (min !== undefined && val < min) return false;
        if (max !== undefined && val > max) return false;
        return true;
      },
      (val) => {
        if (val === undefined) return { message: '' };
        if (integer && !Number.isInteger(val)) {
          return { message: `${fieldName} must be a whole number` };
        }
        if (min !== undefined && val < min) {
          return { message: `${fieldName} must be at least ${min}` };
        }
        if (max !== undefined && val > max) {
          return { message: `${fieldName} cannot exceed ${max}` };
        }
        return { message: '' };
      }
    );

  return required ? validator : validator.optional();
};

export const textSchema = (
  fieldName: string,
  options: { required?: boolean; minLength?: number; maxLength?: number } = {}
) => {
  const { required = false, minLength, maxLength } = options;

  let base = z.string();

  if (minLength !== undefined) {
    base = base.min(minLength, `${fieldName} must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined) {
    base = base.max(maxLength, `${fieldName} must not exceed ${maxLength} characters`);
  }

  if (required) {
    base = base.min(1, `${fieldName} is required`);
  }

  return required ? base : base.optional();
};

export const enumSchema = <T extends [string, ...string[]]>(
  enumValues: T,
  fieldName: string,
  required = true
) => {
  const base = z.enum(enumValues, {
    required_error: `${fieldName} is required`,
    invalid_type_error: `Please select a valid ${fieldName.toLowerCase()}`,
  });

  return required ? base : base.optional();
};

export const postalCodeSchema = (required = false) => {
  const validator = z.string().max(20, 'Postal code must not exceed 20 characters');

  return required ? validator : validator.optional();
};

export const numberArraySchema = (
  fieldName: string,
  options: { required?: boolean; minItems?: number; maxItems?: number } = {}
) => {
  const { required = false, minItems, maxItems } = options;

  let validator = z.array(z.number());

  if (minItems !== undefined) {
    validator = validator.min(
      minItems,
      `Please select at least ${minItems} ${fieldName.toLowerCase()}`
    );
  }

  if (maxItems !== undefined) {
    validator = validator.max(
      maxItems,
      `Please select at most ${maxItems} ${fieldName.toLowerCase()}`
    );
  }

  return required ? validator : validator.optional();
};
