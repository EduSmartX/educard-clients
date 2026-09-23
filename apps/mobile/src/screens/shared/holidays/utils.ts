import type { Holiday } from '@/features/holidays';

/** Check if a Saturday is off based on policy pattern */
function isSaturdayOffByPolicy(day: number, pattern: string): boolean {
  const nthSaturday = Math.ceil(day / 7);
  switch (pattern) {
    case 'ALL':
      return true;
    case 'SECOND_ONLY':
      return nthSaturday === 2;
    case 'SECOND_AND_FOURTH':
      return nthSaturday === 2 || nthSaturday === 4;
    default:
      return false;
  }
}

/** Generate weekend holidays for a month based on working day policy */
export function generateWeekendHolidays(
  workingDayPolicy:
    | { sunday_off: boolean; saturday_off_pattern: string }
    | undefined,
  currentMonth: Date,
): Holiday[] {
  if (!workingDayPolicy) return [];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const endDate = new Date(year, month + 1, 0);
  const holidays: Holiday[] = [];

  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const currentDate = new Date(year, month, 1);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatLocalDate(currentDate);

    if (dayOfWeek === 0 && workingDayPolicy.sunday_off) {
      holidays.push({
        public_id: `sunday-${dateStr}`,
        start_date: dateStr,
        end_date: dateStr,
        holiday_type: 'SUNDAY',
        description: 'Sunday',
      });
    }

    if (
      dayOfWeek === 6 &&
      isSaturdayOffByPolicy(
        currentDate.getDate(),
        workingDayPolicy.saturday_off_pattern,
      )
    ) {
      const nthSaturday = Math.ceil(currentDate.getDate() / 7);
      holidays.push({
        public_id: `saturday-${dateStr}`,
        start_date: dateStr,
        end_date: dateStr,
        holiday_type: nthSaturday === 2 ? 'SECOND_SATURDAY' : 'SATURDAY',
        description: nthSaturday === 2 ? '2nd Saturday' : 'Saturday',
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return holidays;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
