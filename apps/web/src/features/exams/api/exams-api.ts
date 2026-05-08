/**
 * Exams API Client
 *
 * Role-based API structure:
 * - Admin: Full CRUD on sessions, exams, marks
 * - Employee: Read sessions/exams, enter marks for assigned classes
 * - Parent: Read-only access to children's marks
 */

import apiClient from '@/lib/api';
import { isAdminUser } from '@/lib/utils/auth-utils';
import type { ApiListResponse } from '@/lib/utils/api-response-handler';
import type {
  ExamSession,
  ExamSessionListParams,
  ExamSessionCreatePayload,
  ExamSessionUpdatePayload,
  Exam,
  ExamListParams,
  ExamCreatePayload,
  ExamUpdatePayload,
  BulkExamCreatePayload,
  Mark,
  BulkMarkEntry,
} from '../types';

// Role-based endpoints
const ADMIN_BASE_URL = '/exams/admin';
const EMPLOYEE_BASE_URL = '/exams/employee';

/**
 * Get the appropriate base URL based on user role and operation type
 */
function getBaseUrl(isWriteOperation = false): string {
  // Write operations always use admin endpoint
  if (isWriteOperation) {
    return ADMIN_BASE_URL;
  }
  
  // Use admin endpoint for admin users
  if (isAdminUser()) {
    return ADMIN_BASE_URL;
  }
  
  return EMPLOYEE_BASE_URL;
}

/**
 * Get base URL for marks operations
 * Always uses employee endpoint which supports both admin and teacher roles
 */
function getMarksBaseUrl(): string {
  return EMPLOYEE_BASE_URL;
}

// Exam Sessions

export async function fetchExamSessions(
  params?: ExamSessionListParams
): Promise<ApiListResponse<ExamSession>> {
  const baseUrl = getBaseUrl();
  const response = await apiClient.get<ApiListResponse<ExamSession>>(
    `${baseUrl}/sessions/`,
    { params }
  );
  return response.data;
}

export async function fetchExamSession(publicId: string): Promise<ExamSession> {
  const baseUrl = getBaseUrl();
  const response = await apiClient.get<{ success: boolean; data: ExamSession }>(
    `${baseUrl}/sessions/${publicId}/`
  );
  return response.data.data;
}

export async function createExamSession(data: ExamSessionCreatePayload): Promise<ExamSession> {
  const response = await apiClient.post<{ success: boolean; data: ExamSession }>(
    `${ADMIN_BASE_URL}/sessions/`,
    data
  );
  return response.data.data;
}

export async function updateExamSession(
  publicId: string,
  data: ExamSessionUpdatePayload
): Promise<ExamSession> {
  const response = await apiClient.patch<{ success: boolean; data: ExamSession }>(
    `${ADMIN_BASE_URL}/sessions/${publicId}/`,
    data
  );
  return response.data.data;
}

export async function deleteExamSession(publicId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE_URL}/sessions/${publicId}/`);
}

export async function reactivateExamSession(publicId: string): Promise<ExamSession> {
  const response = await apiClient.post<{ success: boolean; data: ExamSession }>(
    `${ADMIN_BASE_URL}/sessions/${publicId}/activate/`
  );
  return response.data.data;
}

export async function bulkUpdateExamStatusBySession(
  sessionId: string,
  status: string
): Promise<{ updated_count: number; status: string; session_id: string }> {
  const response = await apiClient.post<{
    success: boolean;
    data: { updated_count: number; status: string; session_id: string };
  }>(`${ADMIN_BASE_URL}/sessions/${sessionId}/bulk-update-exam-status/`, { status });
  return response.data.data;
}

// Exams (Subject + Session combination)

export async function fetchExams(params?: ExamListParams): Promise<ApiListResponse<Exam>> {
  const baseUrl = getBaseUrl();
  const response = await apiClient.get<ApiListResponse<Exam>>(
    `${baseUrl}/exams/`,
    { params }
  );
  return response.data;
}

export async function fetchExam(publicId: string): Promise<Exam> {
  const baseUrl = getBaseUrl();
  const response = await apiClient.get<{ success: boolean; data: Exam }>(
    `${baseUrl}/exams/${publicId}/`
  );
  return response.data.data;
}

export async function createExam(data: ExamCreatePayload): Promise<Exam> {
  const response = await apiClient.post<{ success: boolean; data: Exam }>(
    `${ADMIN_BASE_URL}/exams/`,
    data
  );
  return response.data.data;
}

export async function bulkCreateExams(data: BulkExamCreatePayload): Promise<Exam[]> {
  const response = await apiClient.post<{ success: boolean; data: Exam[] }>(
    `${ADMIN_BASE_URL}/exams/bulk-create/`,
    data
  );
  return response.data.data;
}

export async function updateExam(publicId: string, data: ExamUpdatePayload): Promise<Exam> {
  const response = await apiClient.patch<{ success: boolean; data: Exam }>(
    `${ADMIN_BASE_URL}/exams/${publicId}/`,
    data
  );
  return response.data.data;
}

export async function deleteExam(publicId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE_URL}/exams/${publicId}/`);
}

export async function reactivateExam(publicId: string): Promise<Exam> {
  const response = await apiClient.post<{ success: boolean; data: Exam }>(
    `${ADMIN_BASE_URL}/exams/${publicId}/activate/`
  );
  return response.data.data;
}

// Marks

/**
 * Bulk upsert marks for multiple students in one exam.
 * Available to both Admin and Employee (teachers).
 */
export interface BulkMarkUpsertPayload {
  session_id: string;
  exam_id: string;
  marks: BulkMarkEntry[];
}

export async function bulkUpsertMarks(
  data: BulkMarkUpsertPayload
): Promise<{ success: boolean; message: string; data: Mark[] }> {
  const baseUrl = getBaseUrl();
  const response = await apiClient.post<{ success: boolean; message: string; data: Mark[] }>(
    `${baseUrl}/marks/bulk-upsert/`,
    data
  );
  return response.data;
}

// Marks Overview API

export interface MarksOverviewSubject {
  exam_public_id: string;
  subject_public_id: string;  // For permission checking
  subject_name: string;
  max_marks: number;
  passing_marks: number;
  status: string;
  date: string | null;
  // Analytics fields
  total_students: number;
  appeared: number;
  absent: number;
  passed: number;
  failed: number;
  highest_marks: number;
  lowest_marks: number;
  total_marks_obtained: number;
  average_marks: number;
  pass_percentage: number;
}

export interface MarksOverviewStudentMark {
  marks_obtained: number;
  is_absent: boolean;
  max_marks: number;
  passing_marks: number;
  is_pass: boolean;
}

export interface MarksOverviewStudent {
  student_public_id: string;
  student_name: string;
  admission_number: string;
  roll_number: string | null;
  gender: string | null;
  profile_photo_thumbnail: string | null;
  marks?: Record<string, MarksOverviewStudentMark>; // exam_public_id -> marks_info (optional - may not have marks yet)
  summary?: {
    total_max: number;
    total_obtained: number;
    percentage: number;
    is_pass: boolean | null;
  };
}

export interface MarksOverviewResponse {
  session: {
    public_id: string;
    name: string;
    session_type: string;
    start_date: string | null;
    end_date: string | null;
  };
  class_info: {
    public_id: string;
    name: string;
    class_master_name: string;
    section_name: string;
  };
  subjects: MarksOverviewSubject[];
  students: MarksOverviewStudent[];
  stats: {
    total_students: number;
    passed_count: number;
    failed_count: number;
    pass_percentage: number;
  };
  permissions?: {
    is_admin: boolean;
    is_class_teacher: boolean;
    can_edit_all_subjects: boolean;
    can_edit: boolean;  // True if user can edit any subjects
    editable_subject_ids: string[] | null;  // null = all subjects, [] = view-only
  };
}

export interface MarksOverviewParams {
  session_id: string;
  class_id: string;
}

export async function fetchMarksOverview(
  params: MarksOverviewParams
): Promise<{ success: boolean; message: string; data: MarksOverviewResponse }> {
  // Always use employee endpoint for marks (supports both admin and teacher roles)
  const baseUrl = getMarksBaseUrl();
  const response = await apiClient.get<{ success: boolean; message: string; data: MarksOverviewResponse }>(
    `${baseUrl}/marks/overview/`,
    { params }
  );
  return response.data;
}

// Bulk Save All Marks (for Marks Overview page)

export interface StudentExamMark {
  exam_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

export interface StudentMarksEntry {
  student_id: string;
  marks: StudentExamMark[];
}

export interface BulkSaveAllMarksPayload {
  session_id: string;
  class_id: string;
  students: StudentMarksEntry[];
}

export async function bulkSaveAllMarks(
  data: BulkSaveAllMarksPayload
): Promise<{ success: boolean; message: string; data: { count: number } }> {
  // Always use employee endpoint for marks (supports both admin and teacher roles)
  const baseUrl = getMarksBaseUrl();
  const response = await apiClient.post<{ success: boolean; message: string; data: { count: number } }>(
    `${baseUrl}/marks/bulk-save-all/`,
    data
  );
  return response.data;
}
