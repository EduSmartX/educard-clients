import { 
  USER_ROLES,
  TimesheetStatus, 
  type TimesheetStatusValue,
  DayLockReason,
  type DayLockReasonValue,
} from '@/constants';
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
  return record.is_leave === true || 
         (record.locked_reason as DayLockReasonValue) === DayLockReason.LEAVE;
}

/**
 * Check if day is a holiday
 */
export function isHolidayDay(record: EmployeeAttendanceRecord): boolean {
  return record.is_holiday === true || 
         (record.locked_reason as DayLockReasonValue) === DayLockReason.HOLIDAY;
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
  return !record.morning_present && 
         !record.afternoon_present && 
         !isHolidayDay(record) && 
         !isLeaveDay(record) && 
         !isNonWorkingDay(record);
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
