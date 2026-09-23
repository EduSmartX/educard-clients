/**
 * Mobile port of the web attendance day-status util.
 * Status wording and colors mirror apps/web get-day-status.ts 1:1
 * (Tailwind tokens converted to hex for React Native).
 */

export interface DayStatusVisual {
  statusText: string;
  textColor: string;
  bgColor: string;
  borderColor?: string;
  rowBg: string;
  isHoliday: boolean;
  hasRecord: boolean;
  isLeave: boolean;
  morningPresent: boolean;
  afternoonPresent: boolean;
  remarks: string;
}

export interface WorkingDayPolicy {
  sunday_off?: boolean;
  saturday_off_pattern?: string;
}

export interface DayAttendanceRecord {
  is_leave?: boolean;
  leave_type_name?: string | null;
  leave_type?: string | null;
  morning_present?: boolean | null;
  afternoon_present?: boolean | null;
}

export interface DayHolidayInfo {
  type?: string;
  name?: string;
  description?: string;
}

export interface DayCalendarException {
  type?: string;
  reason?: string;
}

function getSaturdayWeekNumber(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

interface StatusDisplayParams {
  isForceHoliday: boolean;
  isOfficialHoliday: boolean;
  isWeekend: boolean;
  isForceWorking: boolean;
  isLeave: boolean;
  hasRecord: boolean;
  morningPresent: boolean;
  afternoonPresent: boolean;
  leaveName: string;
}

function getStatusDisplay({
  isForceHoliday,
  isOfficialHoliday,
  isWeekend,
  isForceWorking,
  isLeave,
  hasRecord,
  morningPresent,
  afternoonPresent,
  leaveName,
}: StatusDisplayParams): {
  statusText: string;
  textColor: string;
  bgColor: string;
  borderColor?: string;
  rowBg: string;
} {
  if (isForceHoliday) {
    // text-purple-700 bg-purple-100 border-purple-300 / bg-purple-50/50
    return {
      statusText: 'Special Holiday',
      textColor: '#7e22ce',
      bgColor: '#f3e8ff',
      borderColor: '#d8b4fe',
      rowBg: '#faf5ff',
    };
  }
  if (isOfficialHoliday) {
    // text-purple-600 bg-purple-50 / bg-purple-50/50
    return {
      statusText: 'Holiday',
      textColor: '#9333ea',
      bgColor: '#faf5ff',
      rowBg: '#faf5ff',
    };
  }
  if (isWeekend && !isForceWorking) {
    // text-gray-500 bg-gray-100 / bg-gray-50
    return {
      statusText: 'Weekend',
      textColor: '#6b7280',
      bgColor: '#f3f4f6',
      rowBg: '#f9fafb',
    };
  }
  if (isLeave) {
    // text-yellow-700 bg-yellow-50 border-yellow-300 / bg-yellow-50/30
    return {
      statusText: leaveName || 'Leave',
      textColor: '#a16207',
      bgColor: '#fefce8',
      borderColor: '#fde047',
      rowBg: '#fefce8',
    };
  }
  if (hasRecord && morningPresent && afternoonPresent) {
    // text-green-600 bg-green-50
    return {
      statusText: 'Present',
      textColor: '#16a34a',
      bgColor: '#f0fdf4',
      rowBg: 'transparent',
    };
  }
  if (hasRecord && (morningPresent || afternoonPresent)) {
    // text-blue-600 bg-blue-50
    return {
      statusText: 'Half Day',
      textColor: '#2563eb',
      bgColor: '#eff6ff',
      rowBg: 'transparent',
    };
  }
  if (hasRecord) {
    // text-red-600 bg-red-50
    return {
      statusText: 'Absent',
      textColor: '#dc2626',
      bgColor: '#fef2f2',
      rowBg: 'transparent',
    };
  }
  // text-gray-400 bg-gray-50 / bg-gray-50/50
  return {
    statusText: 'No Record',
    textColor: '#9ca3af',
    bgColor: '#f9fafb',
    rowBg: '#f9fafb',
  };
}

export function getDayStatus(
  date: Date,
  record: DayAttendanceRecord | undefined,
  holidayInfo: DayHolidayInfo | undefined,
  exception: DayCalendarException | undefined,
  policy: WorkingDayPolicy | undefined,
): DayStatusVisual {
  const dayOfWeek = date.getDay();

  const isForceHoliday =
    exception?.type === 'force_holiday' || exception?.type === 'FORCE_HOLIDAY';
  const isForceWorking =
    exception?.type === 'force_working' || exception?.type === 'FORCE_WORKING';
  const isOfficialHoliday = holidayInfo?.type === 'official_holiday';
  const isWeekendDay = holidayInfo?.type === 'weekend';
  const isSundayOff = dayOfWeek === 0 && policy?.sunday_off;
  const isSaturdayOff =
    dayOfWeek === 6 &&
    !!policy &&
    (policy.saturday_off_pattern === 'ALL' ||
      (policy.saturday_off_pattern === 'SECOND_ONLY' &&
        getSaturdayWeekNumber(date) === 2) ||
      (policy.saturday_off_pattern === 'SECOND_AND_FOURTH' &&
        [2, 4].includes(getSaturdayWeekNumber(date))));
  const isWeekend =
    isWeekendDay || (!isForceWorking && !!(isSundayOff || isSaturdayOff));

  const isHoliday =
    isForceHoliday || isOfficialHoliday || !!(isWeekend && !isForceWorking);
  const isLeave = !!record?.is_leave;
  const morningPresent = record?.morning_present ?? false;
  const afternoonPresent = record?.afternoon_present ?? false;
  const hasRecord = !!record;
  const leaveName = record?.leave_type_name || record?.leave_type || '';

  const { statusText, textColor, bgColor, borderColor, rowBg } =
    getStatusDisplay({
      isForceHoliday,
      isOfficialHoliday,
      isWeekend,
      isForceWorking,
      isLeave,
      hasRecord,
      morningPresent,
      afternoonPresent,
      leaveName,
    });

  let weekendLabel = '';
  if (isWeekend) {
    weekendLabel = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
  }
  const remarks =
    holidayInfo?.description ||
    (isLeave ? leaveName : '') ||
    exception?.reason ||
    weekendLabel ||
    '-';

  return {
    statusText,
    textColor,
    bgColor,
    borderColor,
    rowBg,
    isHoliday,
    hasRecord,
    isLeave,
    morningPresent,
    afternoonPresent,
    remarks: remarks || '-',
  };
}
