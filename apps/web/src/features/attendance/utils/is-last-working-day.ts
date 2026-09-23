import { format, eachDayOfInterval, isSameDay, getDay } from 'date-fns';

interface WorkingDayPolicy {
  sunday_off: boolean;
  saturday_off_pattern: string;
}

interface IsLastWorkingDayParams {
  date: Date;
  weekStart: Date;
  weekEnd: Date;
  workingDayPolicy?: WorkingDayPolicy | null;
  holidaySet?: Set<string>;
  exceptionsMap?: Map<string, { type: string; reason: string }>;
  attendanceByDate?: Map<string, unknown>;
}

/**
 * Determine if `date` is the last working day of the week (Sun→Sat).
 * Uses working day policy, holidays, and calendar exceptions to find all
 * working days in the week, then checks whether the date is the last one.
 */
export function isLastWorkingDayOfWeek({
  date,
  weekStart,
  weekEnd,
  workingDayPolicy,
  holidaySet,
  exceptionsMap,
  attendanceByDate,
}: IsLastWorkingDayParams): boolean {
  const policy = workingDayPolicy || { sunday_off: true, saturday_off_pattern: 'ALL' };
  const holidays = holidaySet || new Set<string>();
  const exceptions = exceptionsMap || new Map<string, { type: string; reason: string }>();

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const submittedDateKey = format(date, 'yyyy-MM-dd');

  // Evaluate the whole week (including days after today) so the last working day
  // reflects the policy/holidays, not whichever day happens to be current.
  const workingDays = weekDays.filter((day) => {
    const key = format(day, 'yyyy-MM-dd');

    if (key === submittedDateKey) {
      return true;
    }

    if (attendanceByDate?.has(key)) {
      return true;
    }

    const exception = exceptions.get(key);
    if (exception) {
      return exception.type.toUpperCase() === 'FORCE_WORKING';
    }

    if (holidays.has(key)) {
      return false;
    }

    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 && policy.sunday_off) {
      return false;
    }

    if (dayOfWeek === 6) {
      return isSaturdayWorking(day, policy.saturday_off_pattern);
    }

    return true;
  });

  if (workingDays.length === 0) {
    return false;
  }

  const lastWorkingDay = workingDays[workingDays.length - 1];
  return isSameDay(lastWorkingDay, date);
}

function isSaturdayWorking(day: Date, pattern: string): boolean {
  if (pattern === 'ALL') {
    return false;
  }
  if (pattern === 'NONE') {
    return true;
  }
  const saturdayOfMonth = Math.ceil(day.getDate() / 7);
  if (pattern === 'SECOND_ONLY' && saturdayOfMonth === 2) {
    return false;
  }
  if (pattern === 'FIRST_AND_THIRD' && (saturdayOfMonth === 1 || saturdayOfMonth === 3)) {
    return false;
  }
  if (pattern === 'SECOND_AND_FOURTH' && (saturdayOfMonth === 2 || saturdayOfMonth === 4)) {
    return false;
  }
  return true;
}
