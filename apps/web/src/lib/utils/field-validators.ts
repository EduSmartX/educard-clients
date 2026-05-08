/**
 * Field-level Validators
 * Reusable validation functions for form fields
 * These run on blur to provide immediate feedback
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export function validateEmail(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true }; // Empty is valid (required check is separate)
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
}

/**
 * Phone number validation
 * Accepts various formats: +1234567890, 1234567890, (123) 456-7890, etc.
 */
export function validatePhone(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  // Remove all non-digit characters for length check
  const digitsOnly = value.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: 'Phone number must be at least 10 digits',
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      error: 'Phone number cannot exceed 15 digits',
    };
  }

  return { isValid: true };
}

/**
 * Employee ID validation
 * Alphanumeric, typically 4-20 characters
 */
export function validateEmployeeId(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  if (value.length < 3) {
    return {
      isValid: false,
      error: 'Employee ID must be at least 3 characters',
    };
  }

  if (value.length > 50) {
    return {
      isValid: false,
      error: 'Employee ID cannot exceed 50 characters',
    };
  }

  const alphanumericRegex = /^[a-zA-Z0-9-_]+$/;
  if (!alphanumericRegex.test(value)) {
    return {
      isValid: false,
      error: 'Employee ID can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return { isValid: true };
}

/**
 * Name validation (First Name, Last Name, etc.)
 */
export function validateName(value: string, fieldName: string = 'Name'): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  if (value.length < 1) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 1 characters`,
    };
  }

  if (value.length > 50) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed 50 characters`,
    };
  }

  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  const nameRegex = /^[a-zA-Z\s'-\u00C0-\u017F]+$/;
  if (!nameRegex.test(value)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return { isValid: true };
}

/**
 * Date of Birth validation
 */
export function validateDateOfBirth(
  value: string,
  options: {
    minAge?: number;
    maxAge?: number;
  } = {}
): ValidationResult {
  const { minAge = 18, maxAge = 100 } = options;

  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  const date = new Date(value);
  const today = new Date();

  // Check if valid date
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date',
    };
  }

  // Check if date is in the future
  if (date >= today) {
    return {
      isValid: false,
      error: 'Date of birth must be in the past',
    };
  }

  // Calculate age
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (actualAge < minAge) {
    return {
      isValid: false,
      error: `Age must be at least ${minAge} years`,
    };
  }

  if (actualAge > maxAge) {
    return {
      isValid: false,
      error: `Age cannot exceed ${maxAge} years`,
    };
  }

  return { isValid: true };
}

/**
 * Joining Date validation
 */
export function validateJoiningDate(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  const date = new Date(value);
  const minDate = new Date('1900-01-01');
  const maxFutureMonths = 6; // Allow up to 6 months in the future

  // Check if valid date
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'Please enter a valid date',
    };
  }

  // Check if date is too old
  if (date < minDate) {
    return {
      isValid: false,
      error: 'Joining date cannot be before 1900',
    };
  }

  // Check if date is too far in the future
  const maxFutureDate = new Date();
  maxFutureDate.setMonth(maxFutureDate.getMonth() + maxFutureMonths);

  if (date > maxFutureDate) {
    return {
      isValid: false,
      error: `Joining date cannot be more than ${maxFutureMonths} months in the future`,
    };
  }

  return { isValid: true };
}

/**
 * Numeric value validation
 */
export function validateNumeric(
  value: string | number,
  options: {
    fieldName?: string;
    min?: number;
    max?: number;
    allowDecimal?: boolean;
  } = {}
): ValidationResult {
  const { fieldName = 'Value', min, max, allowDecimal = false } = options;

  if (value === '' || value === null || value === undefined) {
    return { isValid: true };
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (!allowDecimal && numValue !== Math.floor(numValue)) {
    return {
      isValid: false,
      error: `${fieldName} must be a whole number`,
    };
  }

  if (min !== undefined && numValue < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min}`,
    };
  }

  if (max !== undefined && numValue > max) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${max}`,
    };
  }

  return { isValid: true };
}

/**
 * Text length validation
 */
export function validateTextLength(
  value: string,
  options: {
    fieldName?: string;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationResult {
  const { fieldName = 'Field', minLength, maxLength } = options;

  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  const trimmedValue = value.trim();

  if (minLength !== undefined && trimmedValue.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (maxLength !== undefined && trimmedValue.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Alphanumeric validation
 */
export function validateAlphanumeric(
  value: string,
  options: {
    fieldName?: string;
    allowSpaces?: boolean;
    allowSpecialChars?: string;
  } = {}
): ValidationResult {
  const { fieldName = 'Field', allowSpaces = false, allowSpecialChars = '' } = options;

  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  let pattern = 'a-zA-Z0-9';
  if (allowSpaces) pattern += '\\s';
  if (allowSpecialChars) pattern += allowSpecialChars.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');

  const regex = new RegExp(`^[${pattern}]+$`);

  if (!regex.test(value)) {
    let allowedChars = 'letters and numbers';
    if (allowSpaces) allowedChars += ', spaces';
    if (allowSpecialChars) allowedChars += `, and these characters: ${allowSpecialChars}`;

    return {
      isValid: false,
      error: `${fieldName} can only contain ${allowedChars}`,
    };
  }

  return { isValid: true };
}

/**
 * Postal/ZIP code validation
 */
export function validatePostalCode(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  // Allow various postal code formats (US, UK, Canada, India, etc.)
  const postalCodeRegex = /^[A-Z0-9\s-]{3,10}$/i;

  if (!postalCodeRegex.test(value)) {
    return {
      isValid: false,
      error: 'Please enter a valid postal code',
    };
  }

  return { isValid: true };
}

/**
 * URL validation
 */
export function validateUrl(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  try {
    new URL(value);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL',
    };
  }
}

/**
 * Validator factory - Returns appropriate validator based on field type
 */
export function getValidator(
  fieldType:
    | 'email'
    | 'phone'
    | 'employeeId'
    | 'name'
    | 'dateOfBirth'
    | 'joiningDate'
    | 'numeric'
    | 'text'
    | 'alphanumeric'
    | 'postalCode'
    | 'url',
  options?: {
    fieldName?: string;
    min?: number;
    max?: number;
    minAge?: number;
    maxAge?: number;
    minLength?: number;
    maxLength?: number;
    allowDecimal?: boolean;
    allowSpaces?: boolean;
    allowSpecialChars?: string;
  }
) {
  switch (fieldType) {
    case 'email':
      return validateEmail;
    case 'phone':
      return validatePhone;
    case 'employeeId':
      return validateEmployeeId;
    case 'name':
      return (value: string) => validateName(value, options?.fieldName);
    case 'dateOfBirth':
      return (value: string) =>
        validateDateOfBirth(value, { minAge: options?.minAge, maxAge: options?.maxAge });
    case 'joiningDate':
      return validateJoiningDate;
    case 'numeric':
      return (value: string | number) => validateNumeric(value, options);
    case 'text':
      return (value: string) => validateTextLength(value, options);
    case 'alphanumeric':
      return (value: string) => validateAlphanumeric(value, options);
    case 'postalCode':
      return validatePostalCode;
    case 'url':
      return validateUrl;
    default:
      return () => ({ isValid: true });
  }
}
