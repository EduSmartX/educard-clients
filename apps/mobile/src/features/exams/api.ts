/**
 * Exams API — Role-based Admin and Employee endpoints
 *
 * Permission model:
 * - Admin: Full CRUD on sessions, exams, marks
 * - Employee (Teacher):
 *   - Read sessions/exams
 *   - Class Teacher: Can view and edit ALL subject marks for their class
 *   - Subject Teacher: Can view ALL marks but only edit their assigned subjects
 */

import { apiClient } from '@/api/client';
import { isAdminRole } from '@/utils/role-utils';

import type {
  ExamSession,
  Exam,
  Mark,
  MarksOverviewResponse,
  BulkMarkEntry,
  ExamSessionCreatePayload,
  ExamCreatePayload,
  BulkSaveAllMarksPayload,
} from './types';

const ADMIN_BASE = '/exams/admin';
const EMPLOYEE_BASE = '/exams/employee';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination?: { total_count: number; page: number; page_size: number; total_pages: number };
}

interface DetailResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Get the appropriate base URL based on user role and operation type
 */
function getBaseUrl(userRole?: string | null, isWriteOperation = false): string {
  // Write operations always use admin endpoint
  if (isWriteOperation) {
    return ADMIN_BASE;
  }
  // Read operations: use employee endpoint for non-admins
  return isAdminRole(userRole) ? ADMIN_BASE : EMPLOYEE_BASE;
}

// Sessions — Queries
export async function fetchExamSessions(
  params?: Record<string, any>,
  userRole?: string | null
): Promise<{ data: ExamSession[]; pagination?: any }> {
  const baseUrl = getBaseUrl(userRole, false);
  const res = await apiClient.get<ListResponse<ExamSession>>(`${baseUrl}/sessions/`, { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function fetchExamSession(id: string, userRole?: string | null): Promise<ExamSession> {
  const baseUrl = getBaseUrl(userRole, false);
  const res = await apiClient.get<DetailResponse<ExamSession>>(`${baseUrl}/sessions/${id}/`);
  return res.data.data;
}

// Sessions — Mutations (Admin only)
export async function createExamSession(data: ExamSessionCreatePayload): Promise<ExamSession> {
  const res = await apiClient.post<DetailResponse<ExamSession>>(`${ADMIN_BASE}/sessions/`, data);
  return res.data.data;
}

export async function updateExamSession(
  publicId: string,
  data: Partial<ExamSessionCreatePayload>
): Promise<ExamSession> {
  const res = await apiClient.patch<DetailResponse<ExamSession>>(
    `${ADMIN_BASE}/sessions/${publicId}/`,
    data
  );
  return res.data.data;
}

export async function deleteExamSession(publicId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/sessions/${publicId}/`);
}

// Exams — Queries
export async function fetchExams(
  params?: Record<string, any>,
  userRole?: string | null
): Promise<{ data: Exam[]; pagination?: any }> {
  const baseUrl = getBaseUrl(userRole, false);
  const res = await apiClient.get<ListResponse<Exam>>(`${baseUrl}/exams/`, { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function fetchExam(id: string, userRole?: string | null): Promise<Exam> {
  const baseUrl = getBaseUrl(userRole, false);
  const res = await apiClient.get<DetailResponse<Exam>>(`${baseUrl}/exams/${id}/`);
  return res.data.data;
}

// Exams — Mutations (Admin only)
export async function createExam(data: ExamCreatePayload): Promise<Exam> {
  const res = await apiClient.post<DetailResponse<Exam>>(`${ADMIN_BASE}/exams/`, data);
  return res.data.data;
}

export async function updateExam(
  publicId: string,
  data: Partial<ExamCreatePayload>
): Promise<Exam> {
  const res = await apiClient.patch<DetailResponse<Exam>>(`${ADMIN_BASE}/exams/${publicId}/`, data);
  return res.data.data;
}

export async function deleteExam(publicId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/exams/${publicId}/`);
}

// Marks — Always uses employee endpoint (supports both admin and teacher roles)
export async function bulkUpsertMarks(
  data: {
    session_id: string;
    exam_id: string;
    marks: BulkMarkEntry[];
  },
  _userRole?: string | null // Kept for backward compatibility but not used
): Promise<Mark[]> {
  // Always use employee endpoint for marks (supports both admin and teacher roles)
  const res = await apiClient.post<{ success: boolean; data: Mark[] }>(
    `${EMPLOYEE_BASE}/marks/bulk-upsert/`,
    data
  );
  return res.data.data;
}

export async function fetchMarksOverview(
  params: {
    session_id: string;
    class_id: string;
  },
  _userRole?: string | null // Kept for backward compatibility but not used
): Promise<MarksOverviewResponse> {
  // Always use employee endpoint for marks (supports both admin and teacher roles)
  const res = await apiClient.get<{ success: boolean; data: MarksOverviewResponse }>(
    `${EMPLOYEE_BASE}/marks/overview/`,
    { params }
  );
  return res.data.data;
}

// Bulk Save All Marks (for Marks Overview page)
export async function bulkSaveAllMarks(
  data: BulkSaveAllMarksPayload,
  _userRole?: string | null // Kept for backward compatibility but not used
): Promise<{ count: number }> {
  // Always use employee endpoint for marks (supports both admin and teacher roles)
  const res = await apiClient.post<{ success: boolean; data: { count: number } }>(
    `${EMPLOYEE_BASE}/marks/bulk-save-all/`,
    data
  );
  return res.data.data;
}

// Fetch marks for a specific exam (for marks entry)
export async function fetchExamMarks(examId: string): Promise<Mark[]> {
  // Note: by-exam endpoint is only in admin, may need to add to employee if needed
  const res = await apiClient.get<{ success: boolean; data: Mark[] }>(`${EMPLOYEE_BASE}/marks/`, {
    params: { exam_id: examId },
  });
  return res.data.data;
}
