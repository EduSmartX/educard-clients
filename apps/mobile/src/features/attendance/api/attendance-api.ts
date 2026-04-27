/**
 * Attendance API functions
 * Handles student attendance marking and employee timesheet operations
 */

import { apiClient } from '@/api/client';

// ============================================================================
// Types
// ============================================================================

export interface EligibleClass {
  public_id: string;
  class_master: {
    public_id: string;
    name: string;
    display_order: number;
  };
  name: string;
  display_name: string;
  class_teacher: {
    public_id: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  capacity: number;
  student_count: number;
  info: string;
}

export interface DateValidation {
  is_working_day: boolean;
  date: string;
  reason: string | null;
}

export interface ComprehensiveStudentRecord {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string | null;
  admission_number: string | null;
  gender: string;
  profile_photo_thumbnail: string | null;
  attendance_public_id: string | null;
  morning_present: boolean | null;
  afternoon_present: boolean | null;
  attendance_status: string | null;
  attendance_remarks: string | null;
  leave_status: 'approved' | 'pending' | null;
  leave_type: string | null;
  leave_reason: string | null;
}

export interface EmployeeAttendanceRecord {
  date: string;
  morning_present: boolean;
  afternoon_present: boolean;
  approval_status: string;
  remarks?: string;
  is_leave?: boolean;
  leave_type_name?: string | null;
  leave_status?: string | null;
}

export interface TimesheetSubmission {
  public_id: string;
  week_start_date: string;
  week_end_date: string;
  submission_status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  review_comments: string;
  total_working_days: number;
  total_present: number;
  total_absent: number;
  total_holidays: number;
  total_leaves: number;
}

// ============================================================================
// Student Attendance APIs (Admin / Teacher)
// ============================================================================

/** Get classes the current user can mark attendance for */
export async function getEligibleClasses(purpose = 'attendance'): Promise<EligibleClass[]> {
  const res = await apiClient.get('/classes/employee/eligible/', { params: { purpose } });
  return res.data.data || res.data;
}

/** Validate if attendance can be marked for a specific class + date */
export async function validateAttendanceDate(
  classId: string,
  date: string
): Promise<DateValidation> {
  const res = await apiClient.get(
    `/attendance/class/${classId}/student-attendance/validate-date/`,
    { params: { date } }
  );
  return res.data.data || res.data;
}

/** Get comprehensive attendance + leave data for a class on a date */
export async function getComprehensiveAttendance(
  classId: string,
  date: string
): Promise<ComprehensiveStudentRecord[]> {
  const res = await apiClient.get(
    `/attendance/class/${classId}/student-attendance/comprehensive/`,
    { params: { date } }
  );
  return res.data.data || res.data;
}

/** Bulk mark student attendance */
export async function bulkMarkAttendance(
  classId: string,
  payload: {
    date: string;
    period: 'morning' | 'afternoon' | 'full_day';
    attendance_records: {
      user: string;
      morning_present: boolean;
      afternoon_present: boolean;
      remarks?: string;
    }[];
  }
) {
  const res = await apiClient.post(
    `/attendance/class/${classId}/student-attendance/bulk-mark/`,
    payload
  );
  return res.data;
}

// ============================================================================
// Employee Attendance / Timesheet APIs
// ============================================================================

/** Get employee attendance records for a date range */
export async function getEmployeeAttendance(params: {
  from_date: string;
  to_date: string;
}): Promise<{
  records: EmployeeAttendanceRecord[];
  stats: Record<string, number>;
  working_day_policy: { sunday_off: boolean; saturday_off_pattern: string } | null;
  submission_config?: Record<string, any>;
}> {
  const res = await apiClient.get('/attendance/employee-attendance/', { params });
  const payload = res.data?.data || res.data || {};
  return {
    records: payload.records || [],
    stats: payload.stats || {},
    working_day_policy: payload.working_day_policy || null,
    submission_config: payload.submission_config || {},
  };
}

/** Bulk submit employee attendance with timesheet */
export async function bulkSubmitEmployeeAttendance(payload: {
  attendance_records: {
    date: string;
    morning_present: boolean;
    afternoon_present: boolean;
    remarks?: string;
  }[];
  week_start_date: string;
  week_end_date: string;
  submit_timesheet: boolean;
}) {
  const res = await apiClient.post('/attendance/employee-attendance/bulk_submit/', payload);
  return res.data;
}

/** Get timesheet submissions list */
export async function getTimesheetSubmissions(params?: Record<string, string>) {
  const res = await apiClient.get<{ success: boolean; data: TimesheetSubmission[] }>(
    '/attendance/timesheet-submission/',
    { params: { view_type: 'self', ...params } }
  );
  return res.data;
}

/** Check timesheet submission status for a specific week */
export async function checkTimesheetStatus(params: {
  week_start_date: string;
  week_end_date: string;
}) {
  const res = await apiClient.get('/attendance/timesheet-submission/check_status/', { params });
  return res.data?.data || res.data;
}

/** Get organization holidays for a date range */
export async function getOrganizationHolidays(params: {
  from_date: string;
  to_date: string;
}): Promise<{ start_date: string; end_date: string; description: string; holiday_type: string }[]> {
  const res = await apiClient.get('/attendance/holiday-calendar/', { params });
  const payload = res.data || {};
  return Array.isArray(payload.results)
    ? payload.results
    : Array.isArray(payload.data)
      ? payload.data
      : [];
}
