/**
 * Exams API — Admin and Employee endpoints
 */

import { apiClient } from '@/api/client';

import type {
  ExamSession,
  Exam,
  Mark,
  MarksOverviewResponse,
  BulkMarkEntry,
  ExamSessionCreatePayload,
  ExamCreatePayload,
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

// Sessions — Queries
export async function fetchExamSessions(
  params?: Record<string, any>
): Promise<{ data: ExamSession[]; pagination?: any }> {
  const res = await apiClient.get<ListResponse<ExamSession>>(`${ADMIN_BASE}/sessions/`, { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function fetchExamSession(id: string): Promise<ExamSession> {
  const res = await apiClient.get<DetailResponse<ExamSession>>(`${ADMIN_BASE}/sessions/${id}/`);
  return res.data.data;
}

// Sessions — Mutations
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
  params?: Record<string, any>
): Promise<{ data: Exam[]; pagination?: any }> {
  const res = await apiClient.get<ListResponse<Exam>>(`${ADMIN_BASE}/exams/`, { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function fetchExam(id: string): Promise<Exam> {
  const res = await apiClient.get<DetailResponse<Exam>>(`${ADMIN_BASE}/exams/${id}/`);
  return res.data.data;
}

// Exams — Mutations
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

// Marks
export async function bulkUpsertMarks(data: {
  session_id: string;
  exam_id: string;
  marks: BulkMarkEntry[];
}): Promise<Mark[]> {
  const res = await apiClient.post<{ success: boolean; data: Mark[] }>(
    `${ADMIN_BASE}/marks/bulk-upsert/`,
    data
  );
  return res.data.data;
}

export async function fetchMarksOverview(params: {
  session_id: string;
  class_id: string;
}): Promise<MarksOverviewResponse> {
  const res = await apiClient.get<{ success: boolean; data: MarksOverviewResponse }>(
    `${ADMIN_BASE}/marks/overview/`,
    { params }
  );
  return res.data.data;
}

// Fetch marks for a specific exam (for marks entry)
export async function fetchExamMarks(examId: string): Promise<Mark[]> {
  const res = await apiClient.get<{ success: boolean; data: Mark[] }>(
    `${ADMIN_BASE}/marks/by-exam/`,
    { params: { exam_id: examId } }
  );
  return res.data.data;
}
