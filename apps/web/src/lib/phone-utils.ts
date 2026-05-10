/**
 * Phone number utility functions
 */

/**
 * Check if phone number is masked (contains asterisks)
 */
export const isPhoneMasked = (phone: string): boolean => {
  return phone.includes('*');
};

/**
 * Format phone number: XXX-XXX-XXXX (10 digits with dashes)
 * If phone is masked, return as-is
 */
export const formatPhoneNumber = (input: string): string => {
  // If phone is masked, return as-is
  if (isPhoneMasked(input)) {
    return input;
  }
  
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Take only first 10 digits
  const cleaned = digits.slice(0, 10);

  if (cleaned.length === 0) {return '';}
  if (cleaned.length <= 3) {return cleaned;}
  if (cleaned.length <= 6) {return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;}
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

/**
 * Get clean 10-digit phone number (remove all formatting)
 * 789-890-7654 -> 7898907654
 * If phone is masked, return as-is (preserve asterisks)
 */
export const getTenDigitPhoneNumber = (formatted: string): string => {
  // If phone is masked, return as-is
  if (isPhoneMasked(formatted)) {
    return formatted;
  }
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
