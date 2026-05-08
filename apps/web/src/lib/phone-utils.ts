/**
 * Phone number utility functions
 */

/**
 * Format phone number: XXX-XXX-XXXX (10 digits with dashes)
 */
export const formatPhoneNumber = (input: string): string => {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Take only first 10 digits
  const cleaned = digits.slice(0, 10);

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

/**
 * Get clean 10-digit phone number (remove all formatting)
 * 789-890-7654 -> 7898907654
 */
export const getTenDigitPhoneNumber = (formatted: string): string => {
  return formatted.replace(/\D/g, '').slice(0, 10);
};

/**
 * Validate Indian phone number
 * Returns true if valid 10-digit Indian mobile number (starts with 6-9)
 */
export const isValidIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
};
