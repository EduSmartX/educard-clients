import {
  USER_ROLES,
  TimesheetStatus,
  type TimesheetStatusValue,
  DayLockReason,
  type DayLockReasonValue,
} from '@/constants';
import { SaturdayOffPattern } from '@educard/shared';
import type { EmployeeAttendanceRecord } from '../types/index';

/**
 * Check if user has admin role
 */
export function isAdminUser(role?: string): boolean {
  return role === USER_ROLES.ADMIN;
}

/**
 * Check if user has staff role (admin or teacher)
 */
export function isStaffUser(role?: string): boolean {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.TEACHER;
}

/**
 * Check if timesheet can be reviewed (approved/rejected)
 */
export function canReviewTimesheet(status: TimesheetStatusValue): boolean {
  return status === TimesheetStatus.SUBMITTED;
}

/**
 * Check if timesheet can be edited
 */
export function canEditTimesheet(status: TimesheetStatusValue): boolean {
  return status === TimesheetStatus.DRAFT || status === TimesheetStatus.REJECTED;
}

/**
 * Check if day is a leave day
 */
export function isLeaveDay(record: EmployeeAttendanceRecord): boolean {
  return (
    record.is_leave === true || (record.locked_reason as DayLockReasonValue) === DayLockReason.LEAVE
  );
}

/**
 * Check if day is a holiday
 */
export function isHolidayDay(record: EmployeeAttendanceRecord): boolean {
  return (
    record.is_holiday === true ||
    (record.locked_reason as DayLockReasonValue) === DayLockReason.HOLIDAY
  );
}

/**
 * Check if day is a non-working day
 */
export function isNonWorkingDay(record: EmployeeAttendanceRecord): boolean {
  return (record.locked_reason as DayLockReasonValue) === DayLockReason.NON_WORKING_DAY;
}

/**
 * Check if employee is present for full day
 */
export function isFullDayPresent(record: EmployeeAttendanceRecord, includeLeave = false): boolean {
  if (!includeLeave && isLeaveDay(record)) {
    return false;
  }
  return record.morning_present && record.afternoon_present;
}

/**
 * Check if employee has half day attendance
 */
export function isHalfDay(record: EmployeeAttendanceRecord, includeLeave = false): boolean {
  if (!includeLeave && isLeaveDay(record)) {
    return false;
  }
  return record.morning_present !== record.afternoon_present;
}

/**
 * Check if employee is absent for full day
 */
export function isAbsent(record: EmployeeAttendanceRecord): boolean {
  return (
    !record.morning_present &&
    !record.afternoon_present &&
    !isHolidayDay(record) &&
    !isLeaveDay(record) &&
    !isNonWorkingDay(record)
  );
}

/**
 * Get display text for remarks/notes
 */
export function getAttendanceRemarks(record: EmployeeAttendanceRecord): string {
  if (record.holiday_description) {
    return record.holiday_description;
  }
  if (record.remarks) {
    return record.remarks;
  }
  if (isLeaveDay(record) && record.leave_type_name) {
    const status = record.leave_status ? ` (${record.leave_status})` : '';
    return `${record.leave_type_name}${status}`;
  }
  return '-';
}

/**
 * Format employee full name from employee info object
 */
export function getEmployeeFullName(employee?: {
  first_name?: string;
  last_name?: string;
  full_name?: string;
}): string {
  if (!employee) {
    return '';
  }
  if (employee.full_name) {
    return employee.full_name;
  }
  return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercentage(
  presentDays: number,
  totalWorkingDays: number
): string {
  if (totalWorkingDays === 0) {
    return '0.00';
  }
  return ((presentDays / totalWorkingDays) * 100).toFixed(2);
}

/**
 * Working Day Policy type used across attendance features
 */
export interface WorkingDayPolicy {
  sunday_off: boolean;
  saturday_off_pattern: string;
}

/**
 * Determine if a given Saturday is a working day based on the off-pattern.
 * Returns true if the Saturday is a working day.
 */
export function isSaturdayWorking(date: Date, pattern: string): boolean {
  if (pattern === SaturdayOffPattern.NONE) {
    return true;
  }
  if (pattern === SaturdayOffPattern.ALL) {
    return false;
  }
  const saturdayOfMonth = Math.ceil(date.getDate() / 7);
  if (pattern === 'FIRST_AND_THIRD') {
    return saturdayOfMonth !== 1 && saturdayOfMonth !== 3;
  }
  if (pattern === SaturdayOffPattern.SECOND_AND_FOURTH) {
    return saturdayOfMonth !== 2 && saturdayOfMonth !== 4;
  }
  if (pattern === 'SECOND_ONLY') {
    return saturdayOfMonth !== 2;
  }
  return true;
}

/**
 * Determine if a given Saturday is off (inverse of isSaturdayWorking).
 */
export function isSaturdayOff(date: Date, pattern: string): boolean {
  return !isSaturdayWorking(date, pattern);
}

/**
 * Check if a given date is a weekend based on the working day policy.
 */
export function isWeekend(date: Date, policy: WorkingDayPolicy | null): boolean {
  if (!policy) {
    return false;
  }
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 && policy.sunday_off) {
    return true;
  }
  if (dayOfWeek === 6) {
    return isSaturdayOff(date, policy.saturday_off_pattern);
  }
  return false;
}

/**
 * Determine if a date is a working day based on policy, holidays, and exceptions.
 */
export function isWorkingDay(
  date: Date,
  policy: WorkingDayPolicy | null,
  options?: {
    isHoliday?: boolean;
    isForceWorking?: boolean;
  }
): boolean {
  if (options?.isForceWorking) {
    return true;
  }
  if (options?.isHoliday) {
    return false;
  }

  const dayOfWeek = date.getDay();

  if (!policy) {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (dayOfWeek === 0) {
    return !policy.sunday_off;
  }

  if (dayOfWeek === 6) {
    return isSaturdayWorking(date, policy.saturday_off_pattern);
  }

  return true;
}
