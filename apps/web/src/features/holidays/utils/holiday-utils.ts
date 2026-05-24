/**
 * Holiday Calendar Utility Functions
 * Helper functions for holiday calendar operations
 */

import { addDays, differenceInDays, format, isSameDay, parseISO, startOfDay } from 'date-fns';
import type { Holiday, HolidayColors, HolidayType } from '../types';

/**
 * Get color configuration for a holiday type
 */
export function getHolidayTypeColor(type: HolidayType): HolidayColors {
  const colors: Record<HolidayType, HolidayColors> = {
    SUNDAY: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      border: 'border-purple-200',
    },
    SATURDAY: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      border: 'border-blue-200',
    },
    SECOND_SATURDAY: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      border: 'border-indigo-200',
    },
    NATIONAL_HOLIDAY: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700 border-red-200',
      border: 'border-red-200',
    },
    FESTIVAL: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      border: 'border-orange-200',
    },
    ORGANIZATION_HOLIDAY: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-700 border-green-200',
      border: 'border-green-200',
    },
    OTHER: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
      border: 'border-gray-200',
    },
  };

  return colors[type];
}

/**
 * Format holiday type for display
 */
export function formatHolidayType(type: HolidayType): string {
  const labels: Record<HolidayType, string> = {
    SUNDAY: 'Sunday',
    SATURDAY: 'Saturday',
    SECOND_SATURDAY: '2nd Saturday',
    NATIONAL_HOLIDAY: 'National Holiday',
    FESTIVAL: 'Festival',
    ORGANIZATION_HOLIDAY: 'Organization Holiday',
    OTHER: 'Other',
  };

  return labels[type];
}

/**
 * Calculate duration of a holiday in days
 */
export function calculateDuration(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInDays(end, start) + 1; // +1 to include both start and end dates
}

/**
 * Check if a holiday is a weekend holiday (auto-generated)
 */
export function isWeekendHoliday(holiday: Holiday): boolean {
  return (
    holiday.holiday_type === 'SUNDAY' ||
    holiday.holiday_type === 'SATURDAY' ||
    holiday.holiday_type === 'SECOND_SATURDAY'
  );
}

/**
 * Filter out weekend holidays from an array
 */
export function filterNonWeekendHolidays(holidays: Holiday[]): Holiday[] {
  return holidays.filter((h) => !isWeekendHoliday(h));
}

/**
 * Filter to get only weekend holiday types
 */
export function filterWeekendTypes(types: HolidayType[]): HolidayType[] {
  return types.filter((t) => t !== 'SUNDAY' && t !== 'SATURDAY');
}

/**
 * Sort holidays by start date (ascending)
 */
export function sortHolidaysByDate(holidays: Holiday[]): Holiday[] {
  return [...holidays].sort((a, b) => {
    const dateA = parseISO(a.start_date);
    const dateB = parseISO(b.start_date);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Check if a holiday is in the past
 */
export function isHolidayPast(holiday: Holiday, today: Date): boolean {
  const endDate = parseISO(holiday.end_date);
  return endDate < startOfDay(today);
}

/**
 * Get ongoing holidays (excluding weekends)
 */
export function getOngoingHolidays(holidays: Holiday[], currentDate: Date): Holiday[] {
  const today = startOfDay(currentDate);

  const ongoing = holidays.filter((h) => {
    if (isWeekendHoliday(h)) {
      return false;
    }
    const startDate = startOfDay(parseISO(h.start_date));
    const endDate = startOfDay(parseISO(h.end_date));
    return startDate <= today && endDate >= today;
  });

  return sortHolidaysByDate(ongoing);
}

/**
 * Get upcoming holidays (excluding weekends)
 */
export function getUpcomingHolidays(
  holidays: Holiday[],
  fromDate: Date,
  limit: number = 5
): Holiday[] {
  const upcoming = holidays.filter((h) => {
    if (isWeekendHoliday(h)) {
      return false;
    }
    const startDate = parseISO(h.start_date);
    return startDate >= startOfDay(fromDate);
  });

  return sortHolidaysByDate(upcoming).slice(0, limit);
}

/**
 * Check if a specific date is the nth weekday of the month
 * @param date - Date to check
 * @param weekday - Day of week (0=Sunday, 6=Saturday)
 * @param nths - Array of nth occurrences to check (e.g., [2, 4])
 */
export function isNthWeekdayOfMonth(date: Date, weekday: number, nths: number[]): boolean {
  if (date.getDay() !== weekday) {
    return false;
  }

  const day = date.getDate();
  const nthWeekday = Math.ceil(day / 7);

  return nths.includes(nthWeekday);
}

/**
 * Generate weekend holidays based on policy
 */
export interface GenerateWeekendHolidaysOptions {
  startDate: Date;
  endDate: Date;
  sundayOff: boolean;
  saturdayOffPattern: 'NONE' | 'SECOND_ONLY' | 'SECOND_AND_FOURTH' | 'ALL';
}

function getSaturdayHolidayInfo(
  currentDate: Date,
  saturdayOffPattern: 'NONE' | 'SECOND_ONLY' | 'SECOND_AND_FOURTH' | 'ALL'
): {
  isSaturdayOff: boolean;
  holidayType: 'SATURDAY' | 'SECOND_SATURDAY';
  description: string;
} | null {
  const nthSaturday = Math.ceil(currentDate.getDate() / 7);
  let isSaturdayOff: boolean;
  let holidayType: 'SATURDAY' | 'SECOND_SATURDAY' = 'SATURDAY';

  switch (saturdayOffPattern) {
    case 'ALL':
      isSaturdayOff = true;
      holidayType = nthSaturday === 2 ? 'SECOND_SATURDAY' : 'SATURDAY';
      break;
    case 'SECOND_ONLY':
      isSaturdayOff = isNthWeekdayOfMonth(currentDate, 6, [2]);
      holidayType = 'SECOND_SATURDAY';
      break;
    case 'SECOND_AND_FOURTH':
      isSaturdayOff = isNthWeekdayOfMonth(currentDate, 6, [2, 4]);
      holidayType = nthSaturday === 2 ? 'SECOND_SATURDAY' : 'SATURDAY';
      break;
    case 'NONE':
    default:
      isSaturdayOff = false;
  }

  if (!isSaturdayOff) {
    return null;
  }

  let description: string;
  if (nthSaturday === 2) {
    description = '2nd Saturday';
  } else if (nthSaturday === 4) {
    description = '4th Saturday';
  } else {
    description = 'Saturday';
  }
  return { isSaturdayOff: true, holidayType, description: description.trim() };
}

export function generateWeekendHolidays(options: GenerateWeekendHolidaysOptions): Holiday[] {
  const { startDate, endDate, sundayOff, saturdayOffPattern } = options;
  const holidays: Holiday[] = [];

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Check for Sunday
    if (dayOfWeek === 0 && sundayOff) {
      holidays.push({
        public_id: `sunday-${format(currentDate, 'yyyy-MM-dd')}`,
        start_date: format(currentDate, 'yyyy-MM-dd'),
        end_date: format(currentDate, 'yyyy-MM-dd'),
        holiday_type: 'SUNDAY',
        description: 'Sunday',
      });
    }

    // Check for Saturday
    if (dayOfWeek === 6) {
      const satInfo = getSaturdayHolidayInfo(currentDate, saturdayOffPattern);
      if (satInfo) {
        holidays.push({
          public_id: `saturday-${format(currentDate, 'yyyy-MM-dd')}`,
          start_date: format(currentDate, 'yyyy-MM-dd'),
          end_date: format(currentDate, 'yyyy-MM-dd'),
          holiday_type: satInfo.holidayType,
          description: satInfo.description,
        });
      }
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  return holidays;
}

/**
 * Get default form data for creating a holiday
 */
export function getDefaultHolidayFormData(): {
  start_date: string;
  end_date: string;
  holiday_type: Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>;
  description: string;
} {
  return {
    start_date: '',
    end_date: '',
    holiday_type: 'NATIONAL_HOLIDAY',
    description: '',
  };
}

/**
 * Check if dates overlap
 */
export function doDatesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);

  return s1 <= e2 && s2 <= e1;
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (isSameDay(start, end)) {
    return format(start, 'MMM dd, yyyy');
  }

  return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
}

/**
 * Validate holiday form data
 */
export interface HolidayFormValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

export function validateHolidayForm(data: {
  start_date: string;
  end_date?: string;
  description: string;
}): HolidayFormValidationResult {
  const errors: { field: string; message: string }[] = [];

  if (!data.start_date) {
    errors.push({
      field: 'start_date',
      message: 'Start date is required',
    });
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Description is required',
    });
  }

  if (data.description && data.description.trim().length > 255) {
    errors.push({
      field: 'description',
      message: 'Description must be less than 255 characters',
    });
  }

  if (data.end_date && data.start_date) {
    const start = parseISO(data.start_date);
    const end = parseISO(data.end_date);
    if (end < start) {
      errors.push({
        field: 'end_date',
        message: 'End date must be on or after start date',
      });
    }

    const duration = differenceInDays(end, start) + 1;
    if (duration > 60) {
      errors.push({
        field: 'end_date',
        message: 'Holiday duration cannot exceed 60 days',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
