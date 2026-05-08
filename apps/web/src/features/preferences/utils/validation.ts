/**
 * Validation utilities for preference fields
 */

/**
 * Validates time format (HH:MM)
 * @param time - Time string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTimeFormat(time: string): string | null {
  if (!time) return null;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return 'Please enter time in HH:MM format (e.g., 14:30)';
  }
  return null;
}

/**
 * Validates deadline day (1-31)
 * @param day - Day string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateDeadlineDay(day: string): string | null {
  if (!day) return null;
  const dayNum = parseInt(day, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    return 'Please enter a day between 1 and 31';
  }
  return null;
}

/**
 * Parse multi-choice values that come as ["['email']"] from API
 * @param val - Value to parse
 * @returns Array of parsed strings
 */
export function parseMultiChoiceValue(val: string | string[]): string[] {
  if (Array.isArray(val)) {
    return val.flatMap((v) => {
      if (typeof v === 'string' && v.startsWith("['") && v.endsWith("']")) {
        return v
          .slice(2, -2)
          .split("', '")
          .map((item) => item.trim());
      }
      return v;
    });
  }
  return [];
}
