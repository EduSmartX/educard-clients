import {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  differenceInYears,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';

/**
 * Format date to string
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'dd MMM yyyy'
): string {
  if (!date) {
    return '';
  }
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return '';
  }
  return format(dateObj, formatStr);
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  formatStr: string = 'dd MMM yyyy hh:mm a'
): string {
  return formatDate(date, formatStr);
}

/**
 * Format time only
 */
export function formatTime(
  date: Date | string | null | undefined,
  formatStr: string = 'hh:mm a'
): string {
  return formatDate(date, formatStr);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return '';
  }
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format relative date (e.g., "yesterday at 3:00 PM")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return '';
  }
  return formatRelative(dateObj, new Date());
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  if (!isValid(dob)) {
    return 0;
  }
  return differenceInYears(new Date(), dob);
}

/**
 * Get academic year from date
 */
export function getAcademicYear(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  // Academic year starts in April (month 3)
  if (month < 3) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

/**
 * Get date range for current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

/**
 * Check if date is in past
 */
export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return false;
  }
  return isBefore(dateObj, new Date());
}

/**
 * Check if date is in future
 */
export function isDateInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return false;
  }
  return isAfter(dateObj, new Date());
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return false;
  }
  return isSameDay(dateObj, new Date());
}

/**
 * Get working days between two dates (excluding weekends)
 */
export function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = startDate;

  while (isBefore(current, endDate) || isSameDay(current, endDate)) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

/**
 * Parse date string safely
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) {
    return null;
  }
  const date = parseISO(dateStr);
  return isValid(date) ? date : null;
}

/**
 * Format date for API (ISO format)
 */
export function formatDateForAPI(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return '';
  }
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Format a Date to YYYY-MM-DD using local date components (avoids timezone shifts)
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date object (returns undefined on invalid input)
 */
export function parseLocalDate(dateStr?: string | null): Date | undefined {
  if (!dateStr) {
    return undefined;
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return undefined;
  }
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return new Date(y, m, d);
}

/**
 * Format datetime for API (ISO format)
 */
export function formatDateTimeForAPI(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) {
    return '';
  }
  return dateObj.toISOString();
}

/**
 * Get date range presets for filters
 */
export function getDateRangePresets() {
  const today = new Date();

  return {
    today: {
      start: today,
      end: today,
      label: 'Today',
    },
    yesterday: {
      start: subDays(today, 1),
      end: subDays(today, 1),
      label: 'Yesterday',
    },
    last7Days: {
      start: subDays(today, 7),
      end: today,
      label: 'Last 7 days',
    },
    last30Days: {
      start: subDays(today, 30),
      end: today,
      label: 'Last 30 days',
    },
    thisMonth: {
      start: startOfMonth(today),
      end: endOfMonth(today),
      label: 'This month',
    },
    thisWeek: {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
      label: 'This week',
    },
  };
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
