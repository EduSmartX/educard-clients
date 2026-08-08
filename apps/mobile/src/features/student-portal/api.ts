/**
 * Student Portal API — Mobile
 * All student-facing API calls
 */

import { API_ENDPOINTS } from '@educard/shared';

import { apiClient } from '@/api/client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ── Types ────────────────────────────────

export interface StudentDashboardData {
  student_name: string;
  class_name: string;
  attendance_percentage: number;
  total_homework: number;
  pending_homework: number;
  upcoming_exams: number;
}

export interface AttendancePeriodStats {
  working_days: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  percentage: number;
}

export interface AttendanceSummary {
  current_month: AttendancePeriodStats;
  previous_month_percentage: number;
  academic_year_percentage: number;
  growth_rate: number;
}

export interface AttendanceCalendarDay {
  date: string;
  status: string;
}

export interface TimetableEntry {
  slot_public_id: string;
  label: string;
  slot_number: number;
  slot_type: string;
  start_time: string;
  end_time: string;
  subject_name: string | null;
  teacher_name: string | null;
  room: string;
  is_cancelled: boolean;
}

export interface HomeworkItem {
  public_id: string;
  title: string;
  description: string;
  subject_name: string;
  assigned_by_name: string;
  assigned_date: string;
  due_datetime: string;
  priority: 'low' | 'medium' | 'high';
  submission_type: 'online' | 'offline' | 'both';
  reference_link: string | null;
  chapter: string | null;
  is_overdue: boolean;
  days_until_due: number | null;
  my_submission_status: string | null;
}

export interface HomeworkDetail extends HomeworkItem {
  instructions: string;
  attachments: {
    public_id: string;
    file_name: string;
    file_type: string;
    file_url: string;
  }[];
  is_accepting_submissions: boolean;
  my_submission: {
    public_id: string;
    notes: string;
    submitted_at: string;
    status: string;
    is_late: boolean;
    feedback: string | null;
    attachments: { public_id: string; file_name: string; file_url: string }[];
  } | null;
}

export interface ExamSession {
  public_id: string;
  name: string;
  session_type: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ExamResult {
  exam_public_id: string;
  subject_name: string;
  teacher_name: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  max_marks: number;
  passing_marks: number;
  marks_obtained: number | null;
  is_absent: boolean;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
}

export interface ExamSessionDetail extends ExamSession {
  exams: ExamResult[];
  overall_percentage: number;
  overall_grade: string | null;
  rank: number | null;
  total_students: number;
}

export interface FeeSummary {
  public_id: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  paid_percentage: number;
  is_overdue: boolean;
  is_locked: boolean;
  due_date: string | null;
}

export interface FeePayment {
  public_id: string;
  amount: number;
  transaction_type: string;
  payment_mode: string;
  payment_date: string;
  receipt_number: string | null;
  remarks: string;
  created_at: string;
}

export interface FeeComponent {
  public_id: string;
  name: string;
  amount: number;
  component_type: 'mandatory' | 'optional';
  is_selected: boolean;
  approval_status: 'none' | 'pending' | 'approved' | 'rejected';
  request_note: string;
  admin_note: string;
  can_request_change: boolean;
}

export interface LeaveBalance {
  public_id: string;
  leave_type_code: string;
  leave_name: string;
  total_allocated: number;
  used: number;
  carried_forward: number;
  pending: number;
  available: number;
}

export interface LeaveRequest {
  public_id: string;
  leave_name: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: string;
  applied_at: string;
  total_days: number;
}

// ── API Functions ────────────────────────────────

export async function fetchDashboard(): Promise<StudentDashboardData> {
  const res = await apiClient.get<ApiResponse<StudentDashboardData>>(
    API_ENDPOINTS.STUDENT_PORTAL.DASHBOARD,
  );
  return res.data.data;
}

export async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const res = await apiClient.get<ApiResponse<AttendanceSummary>>(
    API_ENDPOINTS.STUDENT_PORTAL.ATTENDANCE.SUMMARY,
  );
  return res.data.data;
}

export async function fetchAttendanceCalendar(
  month: number,
  year: number,
): Promise<AttendanceCalendarDay[]> {
  const res = await apiClient.get<ApiResponse<AttendanceCalendarDay[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.ATTENDANCE.CALENDAR,
    { params: { month, year } },
  );
  return res.data.data;
}

export async function fetchTimetable(date: string): Promise<TimetableEntry[]> {
  const res = await apiClient.get<ApiResponse<TimetableEntry[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.TIMETABLE,
    { params: { date } },
  );
  return res.data.data;
}

export async function fetchHomework(date?: string): Promise<HomeworkItem[]> {
  const params = date ? { date } : undefined;
  const res = await apiClient.get<ApiResponse<HomeworkItem[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.HOMEWORK.LIST,
    { params },
  );
  return res.data.data;
}

export async function fetchHomeworkDetail(
  publicId: string,
): Promise<HomeworkDetail> {
  const res = await apiClient.get<ApiResponse<HomeworkDetail>>(
    API_ENDPOINTS.STUDENT_PORTAL.HOMEWORK.DETAIL(publicId),
  );
  return res.data.data;
}

export async function submitHomework(
  publicId: string,
  data: { notes?: string; file?: { uri: string; name: string; type: string } },
): Promise<void> {
  const formData = new FormData();
  if (data.notes) formData.append('notes', data.notes);
  if (data.file) formData.append('file', data.file as unknown as Blob);
  await apiClient.post(
    API_ENDPOINTS.STUDENT_PORTAL.HOMEWORK.SUBMIT(publicId),
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

export async function fetchExamSessions(): Promise<ExamSession[]> {
  const res = await apiClient.get<ApiResponse<ExamSession[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.EXAMS.SESSIONS,
  );
  return res.data.data;
}

export async function fetchExamSessionDetail(
  publicId: string,
): Promise<ExamSessionDetail> {
  const res = await apiClient.get<ApiResponse<ExamSessionDetail>>(
    API_ENDPOINTS.STUDENT_PORTAL.EXAMS.SESSION_DETAIL(publicId),
  );
  return res.data.data;
}

export async function fetchFeeSummary(): Promise<FeeSummary> {
  const res = await apiClient.get<ApiResponse<FeeSummary>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.SUMMARY,
  );
  return res.data.data;
}

export async function fetchFeePayments(): Promise<FeePayment[]> {
  const res = await apiClient.get<ApiResponse<FeePayment[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.PAYMENTS,
  );
  return res.data.data;
}

export async function fetchFeeComponents(): Promise<FeeComponent[]> {
  const res = await apiClient.get<ApiResponse<FeeComponent[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.COMPONENTS,
  );
  return res.data.data;
}

export async function requestFeeOptOut(
  publicId: string,
  requestNote: string,
): Promise<FeeComponent> {
  const res = await apiClient.post<ApiResponse<FeeComponent>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.COMPONENT_OPT_OUT(publicId),
    { request_note: requestNote },
  );
  return res.data.data;
}

export async function requestFeeOptIn(
  publicId: string,
  requestNote: string,
): Promise<FeeComponent> {
  const res = await apiClient.post<ApiResponse<FeeComponent>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.COMPONENT_OPT_IN(publicId),
    { request_note: requestNote },
  );
  return res.data.data;
}

export async function fetchLeaveBalance(): Promise<LeaveBalance[]> {
  const res = await apiClient.get<ApiResponse<LeaveBalance[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.BALANCE,
  );
  return res.data.data;
}

export async function fetchLeaveRequests(): Promise<LeaveRequest[]> {
  const res = await apiClient.get<ApiResponse<LeaveRequest[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.REQUESTS,
  );
  return res.data.data;
}
