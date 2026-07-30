/**
 * Pure helpers + API calls for the employee timesheet screen.
 * Extracted from my-submissions to keep the screen under the 500-line limit.
 */

import { LEAVE_STATUS, TimesheetStatus } from '@educard/shared/constants';
import {
  format,
  eachDayOfInterval,
  getDay,
  isBefore,
  isSameDay,
} from 'date-fns';
import { Dimensions } from 'react-native';

import { apiClient } from '@/api/client';
import type {
  AttendanceRecord,
  DayState,
  EmployeeAttendanceResponse,
  HolidayDescription,
  TimesheetStatusResponse,
  WeekRow,
} from '@/features/timesheets/types';

const { width: screenWidth } = Dimensions.get('window');
export const CELL_SIZE = Math.floor((screenWidth - 40) / 7);
export const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── API ─────────────────────────────────────────────────────────────────────

export const getEmployeeAttendance = async (
  fromDate: string,
  toDate: string,
): Promise<EmployeeAttendanceResponse> => {
  const response = await apiClient.get<
    { data: EmployeeAttendanceResponse } | EmployeeAttendanceResponse
  >('/attendance/employee-attendance/', {
    params: { from_date: fromDate, to_date: toDate },
  });
  const result = response.data;
  if ('data' in result && result.data) {
    return result.data as EmployeeAttendanceResponse;
  }
  return result as EmployeeAttendanceResponse;
};

export const checkTimesheetStatus = async (
  weekStart: string,
  weekEnd: string,
): Promise<TimesheetStatusResponse> => {
  const response = await apiClient.get<
    { data: TimesheetStatusResponse } | TimesheetStatusResponse
  >('/attendance/timesheet-submission/check_status/', {
    params: { week_start_date: weekStart, week_end_date: weekEnd },
  });
  const result = response.data;
  if ('data' in result && result.data) {
    return result.data as TimesheetStatusResponse;
  }
  return result as TimesheetStatusResponse;
};

export const bulkSubmitAttendance = async (
  payload: Record<string, unknown>,
): Promise<{ message?: string }> => {
  const response = await apiClient.post<{ message?: string }>(
    '/attendance/employee-attendance/bulk_submit/',
    payload,
  );
  return response.data;
};

export const returnTimesheetToDraft = async (payload: {
  week_start_date: string;
  week_end_date: string;
}): Promise<{ message?: string }> => {
  const response = await apiClient.delete<{ message?: string }>(
    '/attendance/timesheet-submission/return_to_draft/',
    {
      params: payload,
    },
  );
  return response.data;
};

// ─── Working-day + day-state helpers ──────────────────────────────────────────

export const toDateKey = (d: Date) => format(d, 'yyyy-MM-dd');

/** Determine if a Saturday is a working day based on pattern */
function isSaturdayWorking(date: Date, pattern: string): boolean {
  if (pattern === 'NONE') return true;
  if (pattern === 'ALL') return false;
  const saturdayOfMonth = Math.ceil(date.getDate() / 7);
  if (pattern === 'FIRST_AND_THIRD')
    return saturdayOfMonth !== 1 && saturdayOfMonth !== 3;
  if (pattern === 'SECOND_AND_FOURTH')
    return saturdayOfMonth !== 2 && saturdayOfMonth !== 4;
  return true;
}

export const isWorkingDay = (
  date: Date,
  workingDayPolicy: {
    sunday_off: boolean;
    saturday_off_pattern: string;
  } | null,
  holidaySet: Set<string>,
  exceptionsMap: Map<string, { type: string }>,
): boolean => {
  const dateKey = toDateKey(date);
  const exception = exceptionsMap.get(dateKey);
  if (exception)
    return (
      exception.type === 'FORCE_WORKING' || exception.type === 'force_working'
    );
  if (holidaySet.has(dateKey)) return false;

  const dayOfWeek = getDay(date);
  if (!workingDayPolicy) return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (dayOfWeek === 0) return !workingDayPolicy.sunday_off;
  if (dayOfWeek === 6)
    return isSaturdayWorking(date, workingDayPolicy.saturday_off_pattern);
  return true;
};

/** Derive day state from an attendance record */
function getStateFromRecord(record: AttendanceRecord): DayState {
  if (record.is_leave) {
    return record.leave_status === LEAVE_STATUS.PENDING
      ? 'leave-pending'
      : 'leave-approved';
  }
  if (record.morning_present && record.afternoon_present) return 'present';
  if (record.morning_present || record.afternoon_present) return 'half_day';
  if (record.morning_present === false && record.afternoon_present === false)
    return 'absent';
  return 'none';
}

export const getDayState = (
  date: Date,
  attendanceByDate: Map<string, AttendanceRecord>,
  holidaySet: Set<string>,
  workingDayPolicy: {
    sunday_off: boolean;
    saturday_off_pattern: string;
  } | null,
  exceptionsMap: Map<string, { type: string }>,
): DayState => {
  const dateKey = toDateKey(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate > today) return 'future';
  if (
    holidaySet.has(dateKey) ||
    !isWorkingDay(date, workingDayPolicy, holidaySet, exceptionsMap)
  )
    return 'holiday';

  const record = attendanceByDate.get(dateKey);
  if (record) return getStateFromRecord(record);

  return isBefore(checkDate, today) && !isSameDay(checkDate, today)
    ? 'absent'
    : 'none';
};

export const stateColors: Record<
  DayState,
  { bg: string; border: string; text: string }
> = {
  present: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  absent: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  half_day: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  'leave-approved': { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  'leave-pending': { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
  holiday: { bg: '#f3e8ff', border: '#d8b4fe', text: '#7c3aed' },
  none: { bg: '#ffffff', border: '#e5e7eb', text: '#374151' },
  future: { bg: '#fafafa', border: '#f3f4f6', text: '#d1d5db' },
};

/** Build week rows from attendance data for a given date range */
export function buildWeekRows(params: {
  weekStart: Date;
  weekEnd: Date;
  attendanceByDate: Map<string, AttendanceRecord>;
  holidayDescriptions: Record<string, HolidayDescription>;
  holidaySet: Set<string>;
  workingDayPolicy: {
    sunday_off: boolean;
    saturday_off_pattern: string;
  } | null;
  exceptionsMap: Map<string, { type: string; reason: string }>;
  defaultPresent: boolean;
  strictLeaveCheck: boolean;
}): WeekRow[] {
  const {
    weekStart,
    weekEnd,
    attendanceByDate,
    holidayDescriptions,
    holidaySet,
    workingDayPolicy,
    exceptionsMap,
    defaultPresent,
    strictLeaveCheck,
  } = params;
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  return days.map(day => {
    const dateKey = toDateKey(day);
    const record = attendanceByDate.get(dateKey);
    const holidayInfo = holidayDescriptions[dateKey];
    const isHoliday =
      holidaySet.has(dateKey) ||
      holidayInfo?.type === 'official_holiday' ||
      holidayInfo?.type === 'holiday' ||
      holidayInfo?.type === 'weekend';
    const isForceWorking = holidayInfo?.type === 'force_working';
    const isLeave = strictLeaveCheck
      ? record?.is_leave &&
        (record?.leave_status === LEAVE_STATUS.APPROVED ||
          record?.leave_status === LEAVE_STATUS.PENDING)
      : record?.is_leave;
    const dayIsWorkingDay = isWorkingDay(
      day,
      workingDayPolicy,
      holidaySet,
      exceptionsMap,
    );

    let locked_reason: WeekRow['locked_reason'];
    if (isHoliday && !isForceWorking) locked_reason = 'holiday';
    else if (isLeave) locked_reason = 'leave';
    else if (!dayIsWorkingDay && !isForceWorking)
      locked_reason = 'non_working_day';

    const morning_present = record?.morning_present ?? defaultPresent;
    const afternoon_present = record?.afternoon_present ?? defaultPresent;

    return {
      date: dateKey,
      dayName: format(day, 'EEE'),
      morning_present,
      afternoon_present,
      locked_reason,
      holiday_name:
        isHoliday && !isForceWorking
          ? holidayInfo?.name || 'Holiday'
          : undefined,
      leave_name: isLeave ? record?.leave_type_name || 'Leave' : undefined,
      is_working_day:
        (dayIsWorkingDay || isForceWorking) &&
        !(isHoliday && !isForceWorking) &&
        !isLeave,
    };
  });
}

/** Check if a day click should be blocked, returns alert info or null */
export function getDayClickBlockReason(
  date: Date,
  state: DayState,
  attendanceByDate: Map<string, AttendanceRecord>,
): { title: string; message: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const clickedDate = new Date(date);
  clickedDate.setHours(0, 0, 0, 0);

  if (clickedDate > today)
    return {
      title: 'Cannot Edit',
      message: 'Cannot submit attendance for future dates.',
    };
  if (state === 'holiday')
    return {
      title: 'Holiday',
      message: 'This is a holiday. No attendance required.',
    };
  if (state === 'leave-approved' || state === 'leave-pending')
    return { title: 'On Leave', message: 'You are on leave for this date.' };

  const record = attendanceByDate.get(format(date, 'yyyy-MM-dd'));
  const status = record?.approval_status?.toLowerCase();
  if (status === TimesheetStatus.APPROVED)
    return {
      title: 'Cannot Edit',
      message: 'This date has been approved and cannot be modified.',
    };
  if (status === TimesheetStatus.SUBMITTED)
    return {
      title: 'Cannot Edit',
      message:
        'This date has been submitted for approval. Wait for approval or return to draft.',
    };

  return null;
}

/** Toggle a single row's attendance field */
export function toggleRowField(
  rows: WeekRow[],
  date: string,
  field: 'morning_present' | 'afternoon_present',
): WeekRow[] {
  return rows.map(row =>
    row.date === date ? { ...row, [field]: !row[field] } : row,
  );
}
