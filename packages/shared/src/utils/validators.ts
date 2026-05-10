/**
 * Shared Utilities - Validators
 * Simple validation helper functions
 * For Zod schemas, see form-schemas.ts
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d < new Date();
}

/**
 * Validate date is in the future
 */
export function isDateInFuture(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d > new Date();
}

/**
 * Validate string is not empty after trimming
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate string length is within range
 */
export function isLengthInRange(
  value: string,
  min: number,
  max: number,
): boolean {
  const len = value.length;
  return len >= min && len <= max;
}

/**
 * Validate PIN code (Indian - 6 digits)
 */
export function isValidPinCode(pin: string): boolean {
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(pin);
}

/**
 * Validate Aadhaar number (12 digits)
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\s/g, ""));
}

/**
 * Validate PAN number (Indian)
 */
export function isValidPan(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

/**
 * Validate that a start date is before or equal to an end date.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  startLabel: string = 'Start date',
  endLabel: string = 'End date'
): string | null {
  if (!startDate || !endDate) {return null;}
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end < start) {
    return `${endLabel} must be on or after ${startLabel.toLowerCase()}`;
  }
  return null;
}
