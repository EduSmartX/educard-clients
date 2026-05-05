import { apiClient } from '@/api/client';

// API Response wrapper type
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

/**
 * Dashboard Attendance Stats Types
 */
export interface AttendanceCategorySummary {
  total_registered: number;
  marked: number;
  present: number;
  absent: number;
  halfday?: number;
  attendance_percentage: number | null;
}

export interface DashboardAttendanceStats {
  date: string;
  is_working_day: boolean;
  is_holiday: boolean;
  holiday_name: string | null;
  overall_attendance_percentage: number | null;
  students: AttendanceCategorySummary;
  employees: AttendanceCategorySummary;
}

/**
 * Get dashboard attendance stats for admin
 */
export const getDashboardAttendanceStats = async (): Promise<DashboardAttendanceStats> => {
  const response = await apiClient.get<ApiResponse<DashboardAttendanceStats>>(
    '/attendance/admin/dashboard-stats/'
  );
  return response.data.data;
};

// ============== MARK ATTENDANCE TYPES ==============

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

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY_FIRST'
  | 'HALF_DAY_SECOND'
  | 'LEAVE'
  | 'HOLIDAY';

export interface ComprehensiveAttendanceRecord {
  // Student information
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string | null;
  admission_number: string | null;
  gender: string;
  profile_photo_thumbnail: string | null;

  // Attendance information
  attendance_public_id: string | null;
  morning_present: boolean | null;
  afternoon_present: boolean | null;
  attendance_status: AttendanceStatus | null;
  attendance_remarks: string | null;

  // Leave information
  leave_status: 'approved' | 'pending' | null;
  leave_type: string | null;
  leave_reason: string | null;
  leave_start_date: string | null;
  leave_end_date: string | null;
}

export interface BulkAttendancePayload {
  date: string;
  period: 'morning' | 'afternoon' | 'full_day';
  attendance_records: {
    user: string;
    morning_present: boolean;
    afternoon_present: boolean;
    remarks?: string;
  }[];
}

// ============== MARK ATTENDANCE API ==============

/**
 * Get eligible classes for attendance marking
 */
export const getEligibleClasses = async (purpose = 'attendance'): Promise<EligibleClass[]> => {
  const response = await apiClient.get<ApiResponse<EligibleClass[]> | EligibleClass[]>(
    '/classes/employee/eligible/',
    { params: { purpose } }
  );
  const data = response.data;
  return 'data' in data ? data.data : data;
};

/**
 * Validate if attendance can be marked for a date
 */
export const validateAttendanceDate = async (
  classId: string,
  date: string
): Promise<DateValidation> => {
  const response = await apiClient.get<ApiResponse<DateValidation> | DateValidation>(
    `/attendance/class/${classId}/student-attendance/validate-date/`,
    { params: { date } }
  );
  const data = response.data;
  return 'data' in data ? data.data : data;
};

/**
 * Get comprehensive attendance data with student + attendance + leave info
 */
export const getComprehensiveAttendance = async (
  classId: string,
  date: string
): Promise<ComprehensiveAttendanceRecord[]> => {
  const response = await apiClient.get<
    ApiResponse<ComprehensiveAttendanceRecord[]> | ComprehensiveAttendanceRecord[]
  >(`/attendance/class/${classId}/student-attendance/comprehensive/`, { params: { date } });
  const data = response.data;
  return 'data' in data ? data.data : data;
};

/**
 * Bulk mark student attendance
 */
export const bulkMarkAttendance = async (
  classId: string,
  payload: BulkAttendancePayload
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    `/attendance/class/${classId}/student-attendance/bulk-mark/`,
    payload
  );
  return response.data;
};

// ============== EMPLOYEE TIMESHEET TYPES & API ==============

export interface EmployeeAttendanceRecord {
  date: string;
  morning_present: boolean | null;
  afternoon_present: boolean | null;
  is_holiday: boolean;
  holiday_name: string | null;
  is_leave: boolean;
  leave_type: string | null;
  leave_status: string | null;
  is_working_day: boolean;
  submission_status: 'draft' | 'pending' | 'approved' | 'rejected' | null;
}

export interface EmployeeAttendanceResponse {
  records: EmployeeAttendanceRecord[];
  stats: {
    total_working_days: number;
    present_days: number;
    absent_days: number;
    half_days: number;
    leave_days: number;
  };
  employee_id: string | null;
  user_info: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  date_range: { from_date: string; to_date: string };
  working_day_policy: {
    sunday_off: boolean;
    saturday_off_pattern: string;
  } | null;
}

export interface TimesheetStatus {
  status: 'draft' | 'pending' | 'approved' | 'rejected' | null;
  submission_date: string | null;
  reviewer_name: string | null;
  review_date: string | null;
  comments: string | null;
  can_edit: boolean;
  can_submit: boolean;
}

export interface SubmitTimesheetPayload {
  from_date: string;
  to_date: string;
  records: {
    date: string;
    morning_present: boolean;
    afternoon_present: boolean;
    remarks?: string;
  }[];
}

/**
 * Get employee's own attendance records for a date range
 * Uses the same endpoint as web for consistency
 */
export const getMyAttendance = async (
  fromDate: string,
  toDate: string
): Promise<EmployeeAttendanceResponse> => {
  // Try the employee-attendance endpoint first (same as web)
  // Fall back to my-attendance if needed
  try {
    const response = await apiClient.get<
      ApiResponse<EmployeeAttendanceResponse> | EmployeeAttendanceResponse
    >('/attendance/employee-attendance/', {
      params: { from_date: fromDate, to_date: toDate },
    });
    const rawData = response.data;
    const data: EmployeeAttendanceResponse = 'data' in rawData ? rawData.data : rawData;
    return {
      records: data.records ?? [],
      stats: data.stats ?? {
        total_working_days: 0,
        present_days: 0,
        absent_days: 0,
        half_days: 0,
        leave_days: 0,
      },
      employee_id: data.employee_id ?? null,
      user_info: data.user_info ?? null,
      date_range: data.date_range ?? { from_date: fromDate, to_date: toDate },
      working_day_policy: data.working_day_policy ?? null,
    };
  } catch {
    // Fallback to my-attendance endpoint
    const response = await apiClient.get<
      ApiResponse<EmployeeAttendanceResponse> | EmployeeAttendanceResponse
    >('/attendance/employee/my-attendance/', {
      params: { from_date: fromDate, to_date: toDate },
    });
    const rawData = response.data;
    return 'data' in rawData ? rawData.data : rawData;
  }
};

/**
 * Check timesheet status for a period
 */
export const checkTimesheetStatus = async (
  fromDate: string,
  toDate: string
): Promise<TimesheetStatus> => {
  const response = await apiClient.get<ApiResponse<TimesheetStatus> | TimesheetStatus>(
    '/attendance/employee/timesheets/status/',
    { params: { from_date: fromDate, to_date: toDate } }
  );
  const data = response.data;
  return 'data' in data ? data.data : data;
};

/**
 * Submit timesheet for approval
 */
export const submitTimesheet = async (
  payload: SubmitTimesheetPayload
): Promise<{ message: string }> => {
  const response = await apiClient.post('/attendance/employee/timesheets/submit/', payload);
  return response.data;
};

/**
 * Return timesheet to draft
 */
export const returnTimesheetToDraft = async (
  fromDate: string,
  toDate: string
): Promise<{ message: string }> => {
  const response = await apiClient.post('/attendance/employee/timesheets/return-to-draft/', {
    from_date: fromDate,
    to_date: toDate,
  });
  return response.data;
};
