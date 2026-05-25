/**
 * Common field validators for bulk upload validation
 * These validators are reusable across students, teachers, classes, and subjects
 */

import { GENDER_ENUM, BLOOD_GROUP_ENUM } from '@educard/shared';

// Valid values including short forms for user convenience
const VALID_GENDERS = [...GENDER_ENUM, 'M', 'F', 'O'];
const VALID_BLOOD_GROUPS = new Set([...BLOOD_GROUP_ENUM, '']);

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export type FieldValidator = (
  value: unknown,
  row: number,
  fieldLabel: string
) => ValidationError | null;

/**
 * Creates a required field validator
 */
export const requiredValidator = (maxLength?: number): FieldValidator => {
  return (value, row, fieldLabel) => {
    if (!value || String(value).trim() === '') {
      return { row, field: fieldLabel, message: `${fieldLabel} is required` };
    }
    if (maxLength && String(value).trim().length > maxLength) {
      return {
        row,
        field: fieldLabel,
        message: `${fieldLabel} is too long (max ${maxLength} characters)`,
      };
    }
    return null;
  };
};

/**
 * Creates an optional text field validator with max length
 */
export const optionalTextValidator = (maxLength: number): FieldValidator => {
  return (value, row, fieldLabel) => {
    if (!value || String(value).trim() === '') {
      return null; // Optional field
    }
    if (String(value).trim().length > maxLength) {
      return {
        row,
        field: fieldLabel,
        message: `${fieldLabel} is too long (max ${maxLength} characters)`,
      };
    }
    return null;
  };
};

/**
 * Email validator (for required email fields)
 */
export const emailValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return { row, field: fieldLabel, message: `${fieldLabel} is required` };
  }
  const emailStr = String(value).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr)) {
    return { row, field: fieldLabel, message: `Invalid email format: "${emailStr}"` };
  }
  if (emailStr.length > 254) {
    return { row, field: fieldLabel, message: `${fieldLabel} is too long (max 254 characters)` };
  }
  return null;
};

/**
 * Optional email validator
 */
export const optionalEmailValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return null; // Email is optional
  }
  const emailStr = String(value).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr)) {
    return { row, field: fieldLabel, message: `Invalid email format: "${emailStr}"` };
  }
  if (emailStr.length > 254) {
    return { row, field: fieldLabel, message: `${fieldLabel} is too long (max 254 characters)` };
  }
  return null;
};

/**
 * Supervisor email validator (handles dropdown format: "Name (email@example.com)")
 */
export const supervisorEmailValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return null; // Supervisor email is optional
  }
  const emailStr = String(value).trim();
  // Check if it looks like a concatenated string (contains semicolons or multiple @)
  if (emailStr.includes(';') || (emailStr.match(/@/g) || []).length > 1) {
    return {
      row,
      field: fieldLabel,
      message: 'Please select only one supervisor from the dropdown. Multiple values detected.',
    };
  }
  // Extract email from format "Name (email@example.com)"
  let email = emailStr;
  const emailRegex = /\(([^)]+@[^)]+)\)/;
  const match = emailRegex.exec(emailStr);
  if (match) {
    email = match[1];
  }
  const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!validEmailRegex.test(email)) {
    return { row, field: fieldLabel, message: `Invalid supervisor email format: "${emailStr}"` };
  }
  return null;
};

/**
 * Phone number validator (10 digits)
 */
export const phoneValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return null; // Phone is optional
  }
  const phoneStr = String(value).replaceAll(/\D/g, ''); // Remove non-digits
  if (phoneStr.length !== 10) {
    return { row, field: fieldLabel, message: `${fieldLabel} must be exactly 10 digits` };
  }
  return null;
};

const DATE_YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;
const DATE_DDMMYYYY = /^\d{2}-\d{2}-\d{4}$/;

/** Parse a date string in YYYY-MM-DD or DD-MM-YYYY format */
function parseDateString(dateStr: string): Date | null {
  if (DATE_YYYYMMDD.test(dateStr)) {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (DATE_DDMMYYYY.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    const d = new Date(`${year}-${month}-${day}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Date validator with format YYYY-MM-DD
 * @param notInFuture - If true, date must not be in the future
 * @param maxFutureMonths - Max months in the future allowed (for dates like admission date)
 */
export const dateValidator = (options?: {
  notInFuture?: boolean;
  maxFutureMonths?: number;
  minAge?: number;
}): FieldValidator => {
  return (value, row, fieldLabel) => {
    if (!value || String(value).trim() === '') {
      return null;
    }
    const dateStr = String(value).trim();

    // Check if it might be an Excel serial date number
    if (typeof value === 'number') {
      return null;
    }

    const date = parseDateString(dateStr);
    if (!date) {
      return {
        row,
        field: fieldLabel,
        message: `Invalid date format. Use YYYY-MM-DD (e.g., 2024-01-15) or DD-MM-YYYY`,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (options?.notInFuture && date >= today) {
      return { row, field: fieldLabel, message: `${fieldLabel} must be in the past` };
    }

    if (options?.maxFutureMonths !== undefined) {
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + options.maxFutureMonths);
      if (date > maxDate) {
        return {
          row,
          field: fieldLabel,
          message: `${fieldLabel} cannot be more than ${options.maxFutureMonths} months in the future`,
        };
      }
    }

    if (options?.minAge !== undefined) {
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - options.minAge);
      if (date > minAgeDate) {
        return { row, field: fieldLabel, message: `Must be at least ${options.minAge} years old` };
      }
    }

    return null;
  };
};

/**
 * Gender validator
 */
export const genderValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return null; // Gender might be optional in some templates
  }
  const genderStr = String(value).trim();
  if (!VALID_GENDERS.some((g) => g.toLowerCase() === genderStr.toLowerCase())) {
    return {
      row,
      field: fieldLabel,
      message: `Invalid gender "${genderStr}". Use M, F, or O (Male, Female, Other)`,
    };
  }
  return null;
};

/**
 * Required gender validator
 */
export const requiredGenderValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return { row, field: fieldLabel, message: `${fieldLabel} is required` };
  }
  return genderValidator(value, row, fieldLabel);
};

/**
 * Blood group validator
 */
export const bloodGroupValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return null; // Blood group is optional
  }
  const bgStr = String(value).trim().toUpperCase();
  if (!VALID_BLOOD_GROUPS.has(bgStr)) {
    return {
      row,
      field: fieldLabel,
      message: `Invalid blood group "${bgStr}". Valid values: ${BLOOD_GROUP_ENUM.join(', ')}`,
    };
  }
  return null;
};

/**
 * Positive integer validator (for fields like capacity, experience years)
 */
export const positiveIntegerValidator = (options?: {
  min?: number;
  max?: number;
}): FieldValidator => {
  return (value, row, fieldLabel) => {
    if (!value || String(value).trim() === '') {
      return null; // Optional
    }
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isInteger(num) || num < 0) {
      return { row, field: fieldLabel, message: `${fieldLabel} must be a positive integer` };
    }
    if (options?.min !== undefined && num < options.min) {
      return { row, field: fieldLabel, message: `${fieldLabel} must be at least ${options.min}` };
    }
    if (options?.max !== undefined && num > options.max) {
      return { row, field: fieldLabel, message: `${fieldLabel} must not exceed ${options.max}` };
    }
    return null;
  };
};

/**
 * Class name validator (expects format "Grade_Section" like "Class 1_A")
 */
export const classNameValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return { row, field: fieldLabel, message: `${fieldLabel} is required` };
  }
  const classStr = String(value).trim();
  if (!classStr.includes('_')) {
    return {
      row,
      field: fieldLabel,
      message: `${fieldLabel} must be in format "Grade_Section" (e.g., "Class 1_A")`,
    };
  }
  return null;
};

/**
 * Roll number validator
 */
export const rollNumberValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return { row, field: fieldLabel, message: `${fieldLabel} is required` };
  }
  if (String(value).trim().length > 20) {
    return { row, field: fieldLabel, message: `${fieldLabel} is too long (max 20 characters)` };
  }
  return null;
};

/**
 * Teacher info validator (format: "Name (email)")
 */
export const teacherInfoValidator: FieldValidator = (value, row, fieldLabel) => {
  if (!value || String(value).trim() === '') {
    return null; // Teacher assignment is optional
  }
  const info = String(value).trim();
  // Check if it contains email in parentheses
  const emailInParenRegex = /\(([^)]+@[^)]+)\)/;
  const match = emailInParenRegex.exec(info);
  if (!match) {
    // Could be just an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(info)) {
      return {
        row,
        field: fieldLabel,
        message: `Invalid format. Expected "Name (email)" or just email`,
      };
    }
  }
  return null;
};
