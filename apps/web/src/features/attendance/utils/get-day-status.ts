/**
 * Utility to determine attendance status for a given day.
 * Used by timesheet-approvals-page and employee-timesheet pages.
 */

export interface DayStatusResult {
  statusText: string;
  statusColor: string;
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

interface AttendanceRecord {
  is_leave?: boolean;
  leave_type_name?: string | null;
  morning_present?: boolean;
  afternoon_present?: boolean;
}

interface HolidayInfo {
  type?: string;
  description?: string;
}

interface CalendarException {
  type?: string;
  reason?: string;
}

function getSaturdayWeekNumber(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

export function getDayStatus(
  date: Date,
  record: AttendanceRecord | undefined,
  holidayInfo: HolidayInfo | undefined,
  exception: CalendarException | undefined,
  policy: WorkingDayPolicy | undefined
): DayStatusResult {
  const dayOfWeek = date.getDay();

  const isForceHoliday = exception?.type === 'force_holiday' || exception?.type === 'FORCE_HOLIDAY';
  const isForceWorking = exception?.type === 'force_working' || exception?.type === 'FORCE_WORKING';
  const isOfficialHoliday = holidayInfo?.type === 'official_holiday';
  const isWeekendDay = holidayInfo?.type === 'weekend';
  const isSundayOff = dayOfWeek === 0 && policy?.sunday_off;
  const isSaturdayOff =
    dayOfWeek === 6 &&
    policy &&
    (policy.saturday_off_pattern === 'ALL' ||
      (policy.saturday_off_pattern === 'SECOND_ONLY' && getSaturdayWeekNumber(date) === 2) ||
      (policy.saturday_off_pattern === 'SECOND_AND_FOURTH' &&
        [2, 4].includes(getSaturdayWeekNumber(date))));
  const isWeekend = isWeekendDay || (!isForceWorking && !!(isSundayOff || isSaturdayOff));

  const isHoliday = isForceHoliday || isOfficialHoliday || !!(isWeekend && !isForceWorking);
  const isLeave = !!record?.is_leave;
  const morningPresent = record?.morning_present ?? false;
  const afternoonPresent = record?.afternoon_present ?? false;
  const hasRecord = !!record;

  const { statusText, statusColor, rowBg } = getStatusDisplay(
    isForceHoliday,
    isOfficialHoliday,
    isWeekend,
    isForceWorking,
    isLeave,
    hasRecord,
    morningPresent,
    afternoonPresent,
    record
  );

  const remarks =
    holidayInfo?.description ||
    (isLeave ? record?.leave_type_name : '') ||
    exception?.reason ||
    (isWeekend ? (dayOfWeek === 0 ? 'Sunday' : 'Saturday') : '') ||
    '-';

  return {
    statusText,
    statusColor,
    rowBg,
    isHoliday,
    hasRecord,
    isLeave,
    morningPresent,
    afternoonPresent,
    remarks: remarks || '-',
  };
}

function getStatusDisplay(
  isForceHoliday: boolean,
  isOfficialHoliday: boolean,
  isWeekend: boolean,
  isForceWorking: boolean,
  isLeave: boolean,
  hasRecord: boolean,
  morningPresent: boolean,
  afternoonPresent: boolean,
  record: AttendanceRecord | undefined
): { statusText: string; statusColor: string; rowBg: string } {
  if (isForceHoliday) {
    return {
      statusText: 'Special Holiday',
      statusColor: 'text-purple-700 bg-purple-100 border-purple-300',
      rowBg: 'bg-purple-50/50',
    };
  }
  if (isOfficialHoliday) {
    return {
      statusText: 'Holiday',
      statusColor: 'text-purple-600 bg-purple-50',
      rowBg: 'bg-purple-50/50',
    };
  }
  if (isWeekend && !isForceWorking) {
    return {
      statusText: 'Weekend',
      statusColor: 'text-gray-500 bg-gray-100',
      rowBg: 'bg-gray-50',
    };
  }
  if (isLeave) {
    return {
      statusText: record?.leave_type_name || 'Leave',
      statusColor: 'text-yellow-700 bg-yellow-50 border-yellow-300',
      rowBg: 'bg-yellow-50/30',
    };
  }
  if (hasRecord && morningPresent && afternoonPresent) {
    return {
      statusText: 'Present',
      statusColor: 'text-green-600 bg-green-50',
      rowBg: '',
    };
  }
  if (hasRecord && (morningPresent || afternoonPresent)) {
    return {
      statusText: 'Half Day',
      statusColor: 'text-blue-600 bg-blue-50',
      rowBg: '',
    };
  }
  if (hasRecord) {
    return {
      statusText: 'Absent',
      statusColor: 'text-red-600 bg-red-50',
      rowBg: '',
    };
  }
  return {
    statusText: 'No Record',
    statusColor: 'text-gray-400 bg-gray-50',
    rowBg: 'bg-gray-50/50',
  };
}
