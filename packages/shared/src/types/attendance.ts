/**
 * Attendance Types
 *
 * Type definitions for attendance tracking including student attendance,
 * employee timesheets, holidays, and attendance reporting/analytics.
 * Used across Web, iOS, and Android for consistent data handling.
 *
 * @module types/attendance
 */

import type { AuditFields, BaseQueryParams } from "./common";
import type { AttendanceStatusType } from "../constants/attendance";

// Re-export from constants for convenience
export type { AttendanceStatusType };

// Related Entities

export interface StudentRow {
  public_id: string;
  admission_number: string;
  full_name: string;
  profile_photo_thumbnail?: string | null;
  roll_number?: string;
}

// Attendance Response Types

export interface AttendanceRecord extends AuditFields {
  public_id: string;
  student: StudentRow;
  date: string;
  status: AttendanceStatusType;
  remarks?: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  is_late?: boolean;
  late_minutes?: number;
  marked_by?: {
    public_id: string;
    full_name: string;
  };
}

export interface ComprehensiveAttendanceRecord {
  date: string;
  day_name: string;
  is_holiday: boolean;
  holiday_name?: string;
  attendance?: {
    status: AttendanceStatusType;
    remarks?: string;
    check_in_time?: string | null;
    check_out_time?: string | null;
    is_late?: boolean;
  };
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  holiday_days: number;
  leave_days: number;
  attendance_percentage: number;
}

// Request Payloads

export interface SingleAttendancePayload {
  student_id: string;
  status: AttendanceStatusType;
  remarks?: string;
  check_in_time?: string;
  check_out_time?: string;
}

export interface BulkAttendancePayload {
  date: string;
  class_id: string;
  attendance_records: SingleAttendancePayload[];
}

export interface MarkAttendancePayload {
  date: string;
  status: AttendanceStatusType;
  remarks?: string;
  check_in_time?: string;
  check_out_time?: string;
}

// Query Parameters

export interface AttendanceQueryParams extends BaseQueryParams {
  class_id?: string;
  student_id?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  status?: AttendanceStatusType;
  month?: number;
  year?: number;
}

// Attendance Reports

export interface ClassAttendanceReport {
  class_id: string;
  class_name: string;
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  not_marked: number;
  attendance_percentage: number;
}

export interface StudentAttendanceReport {
  student: StudentRow;
  summary: AttendanceSummary;
  records: ComprehensiveAttendanceRecord[];
}

// Holiday Types

export interface Holiday {
  public_id: string;
  name: string;
  date: string;
  type: "public" | "school" | "optional";
  description?: string;
  is_recurring?: boolean;
}

// Employee Timesheet Types

export interface TimesheetEntry extends AuditFields {
  public_id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: "present" | "absent" | "half_day" | "leave" | "holiday";
  working_hours?: number;
  overtime_hours?: number;
  remarks?: string;
}

export interface TimesheetSummary {
  employee_id: string;
  employee_name: string;
  month: number;
  year: number;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  total_working_hours: number;
  total_overtime_hours: number;
  attendance_percentage: number;
}
