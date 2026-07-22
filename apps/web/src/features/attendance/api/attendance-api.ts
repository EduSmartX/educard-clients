import apiClient from '@/lib/api';
import type {
  EligibleClass,
  DateValidation,
  AttendanceRecord,
  BulkAttendancePayload,
  ComprehensiveAttendanceRecord,
  EmployeeAttendanceBulkPayload,
  EmployeeAttendanceRecord,
  EmployeeSubmissionConfig,
  CalendarGridResponse,
  CalendarException,
} from '../types/index';

// Get eligible classes for attendance marking
export const getEligibleClasses = async (purpose = 'attendance'): Promise<EligibleClass[]> => {
  const response = await apiClient.get(`/classes/employee/eligible/`, {
    params: { purpose },
  });
  return response.data.data || response.data;
};

// Validate if attendance can be marked for a date
export const validateAttendanceDate = async (
  classId: string,
  date: string
): Promise<DateValidation> => {
  const response = await apiClient.get(
    `/attendance/class/${classId}/student-attendance/validate-date/`,
    { params: { date } }
  );
  return response.data.data || response.data;
};

export const getStudentsForClass = async (classId: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const comprehensive = await getComprehensiveAttendance(classId, today);

  return (comprehensive || []).map((s) => ({
    public_id: s.public_id,
    user: {
      public_id: s.public_id,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
    },
    roll_number: s.roll_number || '',
    admission_number: s.admission_number || '',
    class_assigned: {
      public_id: classId,
      display_name: '',
    },
  }));
};

export const getAttendanceForDate = async (
  classId: string,
  date: string
): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get(`/attendance/class/${classId}/student-attendance/by-date/`, {
    params: { date },
  });
  return response.data.data || response.data;
};

// Get comprehensive attendance data with leave information (RECOMMENDED)
// This replaces the need for separate student list and attendance calls
export const getComprehensiveAttendance = async (
  classId: string,
  date: string
): Promise<ComprehensiveAttendanceRecord[]> => {
  // Embed images to reduce HTTP requests (Base64 data URIs for profile photos)
  const response = await apiClient.get(
    `/attendance/class/${classId}/student-attendance/comprehensive/`,
    {
      params: { date, embed_images: true },
    }
  );
  return response.data.data || response.data;
};

// Bulk mark student attendance
export const bulkMarkAttendance = async (
  classId: string,
  payload: BulkAttendancePayload
): Promise<{ message: string; data: { failed: number; records: AttendanceRecord[] } }> => {
  const response = await apiClient.post(
    `/attendance/class/${classId}/student-attendance/bulk-mark/`,
    payload
  );
  return response.data;
};

export const getEmployeeAttendance = async (params: {
  from_date: string;
  to_date: string;
  user_public_id?: string;
}): Promise<{
  records: EmployeeAttendanceRecord[];
  stats: Record<string, number>;
  employee_id: string | null;
  user_info: Record<string, unknown> | null;
  date_range: { from_date: string; to_date: string };
  working_day_policy: {
    sunday_off: boolean;
    saturday_off_pattern: string;
  } | null;
  calendar_exceptions: Array<{
    date: string;
    type: string;
    reason: string;
  }>;
  holiday_descriptions: Record<
    string,
    {
      type: string;
      name: string;
      description: string;
    }
  >;
  pagination: {
    count: number;
    page_size: number;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };
  submission_config?: EmployeeSubmissionConfig;
}> => {
  // Map user_public_id to 'user' parameter expected by backend
  const apiParams: Record<string, string> = {
    from_date: params.from_date,
    to_date: params.to_date,
  };
  if (params.user_public_id) {
    apiParams.user = params.user_public_id;
  }

  const response = await apiClient.get('/attendance/employee-attendance/', {
    params: apiParams,
    timeout: 60000,
  });
  const payload = response.data?.data || response.data || {};

  return {
    records: payload.records || [],
    stats: payload.stats || {},
    employee_id: payload.employee_id || null,
    user_info: payload.user_info || null,
    date_range: payload.date_range || { from_date: params.from_date, to_date: params.to_date },
    working_day_policy: payload.working_day_policy || null,
    calendar_exceptions: payload.calendar_exceptions || [],
    holiday_descriptions: payload.holiday_descriptions || {},
    pagination: payload.pagination || {
      count: 0,
      page_size: 10,
      current_page: 1,
      total_pages: 0,
      has_next: false,
      has_previous: false,
      next_page: null,
      previous_page: null,
    },
    submission_config: payload.submission_config || {},
  };
};

// Lightweight stats-only endpoint for dashboards (no records/pagination).
export const getEmployeeAttendanceStats = async (params: {
  from_date: string;
  to_date: string;
  user_public_id?: string;
}): Promise<{
  stats: Record<string, number>;
  date_range: { from_date: string; to_date: string };
}> => {
  const apiParams: Record<string, string> = {
    from_date: params.from_date,
    to_date: params.to_date,
  };
  if (params.user_public_id) {
    apiParams.user = params.user_public_id;
  }

  const response = await apiClient.get('/attendance/employee-attendance/stats/', {
    params: apiParams,
    timeout: 60000,
  });
  const payload = response.data?.data || response.data || {};

  return {
    stats: payload.stats || {},
    date_range: payload.date_range || { from_date: params.from_date, to_date: params.to_date },
  };
};

export const bulkSubmitEmployeeAttendance = async (
  payload: EmployeeAttendanceBulkPayload & {
    submit_timesheet?: boolean;
    week_start_date?: string;
    week_end_date?: string;
  }
) => {
  const response = await apiClient.post('/attendance/employee-attendance/bulk_submit/', payload);
  return response.data;
};

// Fetch calendar grid data for yearly attendance view
export const fetchCalendarGridData = async (params: {
  user: string;
  year?: number;
}): Promise<CalendarGridResponse> => {
  const response = await apiClient.get('/attendance/employee-attendance/calendar-grid/', {
    params,
  });
  return response.data.data || response.data;
};

// Fetch organization holidays for a date range
export const fetchOrganizationHolidays = async (params: {
  from_date: string;
  to_date: string;
}): Promise<{
  holidays: Array<{
    public_id: string;
    start_date: string;
    end_date: string;
    holiday_type: string;
    description: string;
  }>;
}> => {
  const response = await apiClient.get('/attendance/holiday-calendar/', {
    params,
  });

  const payload = response.data || {};
  const getHolidaysArray = () => {
    if (Array.isArray(payload.results)) {
      return payload.results;
    }
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
    return [];
  };
  const holidays = getHolidaysArray();

  return { holidays };
};

// Timesheet Submission APIs

export interface TimesheetSubmission {
  public_id: string;
  employee_info: {
    public_id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
    gender?: string;
    role?: string;
    organization_role?: {
      id: number;
      name: string;
      code: string;
    } | null;
    employee_id?: string;
  };
  week_start_date: string;
  week_end_date: string;
  submission_status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'REJECTED';
  status_display: string;
  submitted_at: string | null;
  submitted_by_info: {
    public_id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
    gender?: string;
    role?: string;
    organization_role?: {
      id: number;
      name: string;
      code: string;
    } | null;
    employee_id?: string;
  } | null;
  reviewed_at: string | null;
  reviewed_by_info: {
    public_id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
    gender?: string;
    role?: string;
    organization_role?: {
      id: number;
      name: string;
      code: string;
    } | null;
    employee_id?: string;
  } | null;
  review_comments: string | null;
  total_working_days: number;
  total_present_days: number;
  total_absent_days: number;
  total_half_days: number;
  total_leave_days: number;
  total_holidays: number;
  attendance_percentage: string | number;
  created_at: string;
  updated_at: string;
  created_by_public_id?: string;
  created_by_name?: string;
  updated_by_public_id?: string;
  updated_by_name?: string;
}
// Check timesheet submission status for a specific week
export const checkTimesheetStatus = async (params: {
  week_start_date: string;
  week_end_date: string;
}): Promise<{ submission: TimesheetSubmission | null }> => {
  try {
    const response = await apiClient.get('/attendance/timesheet-submission/check_status/', {
      params,
    });
    const data = response.data.data || response.data;

    // Handle nested submission structure
    const submission = data.submission || data;

    // If submission_status is null, return null submission
    if (!submission?.submission_status) {
      return { submission: null };
    }

    return { submission };
  } catch (error: unknown) {
    // Return null if not found (404) - though this shouldn't happen now
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        return { submission: null };
      }
    }
    throw error;
  }
};

export const returnTimesheetToDraft = async (params: {
  week_start_date: string;
  week_end_date: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    '/attendance/timesheet-submission/return_to_draft/',
    {
      params,
    }
  );
  return response.data;
};

// Get list of timesheet submissions
export const getTimesheetSubmissions = async (params?: {
  view_type?: 'self' | 'staff';
  employee_public_id?: string;
  submission_status?: string;
  week_start_date?: string;
  from_date?: string;
  to_date?: string;
}): Promise<{
  results: TimesheetSubmission[];
  count: number;
}> => {
  const response = await apiClient.get('/attendance/timesheet-submission/', { params });
  const responseData = response.data.data || response.data;

  // If responseData is an array, it's the direct data array
  if (Array.isArray(responseData)) {
    return {
      results: responseData,
      count: response.data.pagination?.count || responseData.length,
    };
  }

  // Otherwise it might already be in the { results, count } format
  return responseData;
};

export interface PendingTimesheetWeek {
  week_start_date: string;
  week_end_date: string;
  status: 'NOT_SUBMITTED' | 'DRAFT' | 'RETURNED';
  label: string;
}

// Get the current user's pending timesheet weeks (never-submitted + draft + returned)
export const getPendingTimesheets = async (): Promise<{
  results: PendingTimesheetWeek[];
  pending_count: number;
}> => {
  const response = await apiClient.get('/attendance/timesheet-submission/pending/');
  const responseData = response.data.data || response.data;
  return {
    results: responseData.results || [],
    pending_count: responseData.pending_count ?? responseData.results?.length ?? 0,
  };
};

// Get detailed timesheet submission
export const getTimesheetSubmissionDetail = async (
  submissionId: string
): Promise<TimesheetSubmission> => {
  const response = await apiClient.get(`/attendance/timesheet-submission/${submissionId}/`);
  return response.data.data || response.data;
};

// Review (approve/return/reject) timesheet
export const reviewTimesheet = async (
  submissionId: string,
  payload: {
    submission_status: 'APPROVED' | 'RETURNED' | 'REJECTED';
    review_comments?: string;
  }
): Promise<{ submission: TimesheetSubmission; message?: string }> => {
  const response = await apiClient.post(
    `/attendance/timesheet-submission/${submissionId}/review/`,
    payload
  );
  return { ...(response.data.data || response.data), message: response.data.message };
};

// Monthly attendance summary (NEW - backend calculated)
export interface MonthlyAttendanceData {
  month_name: string;
  month_number: number;
  year: number;
  total_working_days: number;
  total_present: number;
  total_absent: number;
  total_half_days: number;
  total_leaves: number;
  total_holidays: number;
  attendance_percentage: number;
}

export interface MonthlyAttendanceSummary {
  academic_year: string;
  start_date: string;
  end_date: string;
  monthly_data: MonthlyAttendanceData[];
  total_summary: {
    total_working_days: number;
    total_present: number;
    total_absent: number;
    total_half_days: number;
    total_leaves: number;
    total_holidays: number;
    attendance_percentage: number;
  };
  employee_id: string | null;
  user_info: {
    public_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const getMonthlyAttendanceSummary = async (params: {
  user: string;
  year?: number;
}): Promise<MonthlyAttendanceSummary> => {
  const response = await apiClient.get('/attendance/employee-attendance/monthly-summary/', {
    params,
  });
  return response.data.data || response.data;
};

// ============================================================================
// CALENDAR EXCEPTIONS API
// ============================================================================

/**
 * Fetch all calendar exceptions for the organization
 */
export const fetchCalendarExceptions = async (params?: {
  from_date?: string;
  to_date?: string;
}): Promise<{ data: CalendarException[]; count: number }> => {
  const response = await apiClient.get('/attendance/employee-attendance/calendar-exceptions/', {
    params,
  });
  return {
    data: response.data.data || response.data.results || response.data,
    count:
      response.data.count || (response.data.data || response.data.results || response.data).length,
  };
};

/**
 * Get a single calendar exception by ID
 */
export const getCalendarException = async (exceptionId: string): Promise<CalendarException> => {
  const response = await apiClient.get(
    `/attendance/employee-attendance/calendar-exceptions/${exceptionId}/`
  );
  return response.data.data || response.data;
};

/**
 * Create a new calendar exception
 */
export const createCalendarException = async (payload: {
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes?: boolean;
  is_applicable_to_all_teachers?: boolean;
  classes?: string[]; // Array of class public_ids
}): Promise<CalendarException> => {
  const response = await apiClient.post(
    '/attendance/employee-attendance/calendar-exceptions/',
    payload
  );
  return response.data.data || response.data;
};

/**
 * Update an existing calendar exception
 */
export const updateCalendarException = async (
  exceptionId: string,
  payload: Partial<{
    date: string;
    override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
    reason: string;
    is_applicable_to_all_classes: boolean;
    is_applicable_to_all_teachers: boolean;
    classes: string[];
  }>
): Promise<CalendarException> => {
  const response = await apiClient.patch(
    `/attendance/employee-attendance/calendar-exceptions/${exceptionId}/`,
    payload
  );
  return response.data.data || response.data;
};

/**
 * Delete a calendar exception
 */
export const deleteCalendarException = async (exceptionId: string): Promise<void> => {
  await apiClient.delete(`/attendance/employee-attendance/calendar-exceptions/${exceptionId}/`);
};

/**
 * Dashboard attendance stats (admin only)
 * Returns today's student & employee attendance summary.
 */
export interface DashboardAttendanceStats {
  date: string;
  is_holiday: boolean;
  holiday_name: string | null;
  is_working_day: boolean;
  overall_attendance_percentage: number | null;
  students: {
    total_registered: number;
    marked: number;
    present: number;
    absent: number;
    halfday: number;
    attendance_percentage: number | null;
  };
  employees: {
    total_registered: number;
    marked: number;
    present: number;
    absent: number;
    attendance_percentage: number | null;
  };
}

export const getDashboardAttendanceStats = async (): Promise<DashboardAttendanceStats> => {
  const response = await apiClient.get('/attendance/admin/dashboard-stats/');
  return response.data.data || response.data;
};

/**
 * Class-wise attendance summary
 * Returns attendance summary per class for the Attendance Summary page.
 * Uses employee endpoint that works for both admins and teachers.
 * - Admins see all classes
 * - Teachers see only their assigned classes
 */
export interface ClassTeacherInfo {
  public_id: string;
  full_name: string;
  email: string;
}

export interface ClassAttendanceSummaryItem {
  public_id: string;
  name: string;
  grade: string;
  section: string;
  total_students: number;
  marked: number;
  present: number;
  absent: number;
  halfday: number;
  unmarked: number;
  submission_status: 'submitted' | 'pending';
  attendance_percentage: number;
  class_teacher: ClassTeacherInfo | null;
  class_teacher_name?: string;
}

export interface ClassAttendanceSummary {
  date: string;
  is_holiday: boolean;
  is_working_day: boolean;
  holiday_name: string | null;
  summary: {
    total_classes: number;
    classes_submitted: number;
    classes_pending: number;
    total_students: number;
    total_marked: number;
  };
  classes: ClassAttendanceSummaryItem[];
  can_send_notifications?: boolean; // Only true for admins
}

export const getClassAttendanceSummary = async (date?: string): Promise<ClassAttendanceSummary> => {
  const params = date ? { date } : {};
  // Use employee endpoint that works for both admins and teachers
  const response = await apiClient.get('/attendance/employee/class-summary/', { params });
  return response.data.data || response.data;
};
