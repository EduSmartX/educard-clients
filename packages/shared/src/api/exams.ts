/**
 * Exams API — Shared between Web and Mobile
 * Factory pattern for platform-agnostic API calls
 */

import type { AxiosInstance } from 'axios';
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
  BulkMarkUpsertPayload,
  MarksOverviewResponse,
  BulkSaveAllMarksPayload,
} from '../types/exam';

// =============================================================================
// Types
// =============================================================================

interface ApiListResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: {
    count?: number;
    total_count?: number;
    page: number;
    page_size: number;
    total_pages: number;
    next?: string | null;
    previous?: string | null;
  };
}

interface ApiDetailResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ExamsApiConfig {
  /** Axios client instance */
  client: AxiosInstance;
  /** Function to check if current user is admin */
  isAdminUser: () => boolean;
}

// =============================================================================
// Endpoints
// =============================================================================

const ADMIN_BASE = '/exams/admin';
const EMPLOYEE_BASE = '/exams/employee';

function getBaseUrl(isAdmin: boolean, isWriteOperation = false): string {
  if (isWriteOperation) {return ADMIN_BASE;}
  return isAdmin ? ADMIN_BASE : EMPLOYEE_BASE;
}

// =============================================================================
// API Factory
// =============================================================================

export function createExamsApi(config: ExamsApiConfig) {
  const { client, isAdminUser } = config;

  return {
    // =========================================================================
    // Exam Sessions
    // =========================================================================

    async listSessions(params?: ExamSessionListParams): Promise<{
      data: ExamSession[];
      pagination?: ApiListResponse<ExamSession>['pagination'];
    }> {
      const baseUrl = getBaseUrl(isAdminUser());
      const res = await client.get<ApiListResponse<ExamSession>>(`${baseUrl}/sessions/`, { params });
      return { data: res.data.data, pagination: res.data.pagination };
    },

    async getSession(publicId: string): Promise<ExamSession> {
      const baseUrl = getBaseUrl(isAdminUser());
      const res = await client.get<ApiDetailResponse<ExamSession>>(`${baseUrl}/sessions/${publicId}/`);
      return res.data.data;
    },

    async createSession(data: ExamSessionCreatePayload): Promise<ExamSession> {
      const res = await client.post<ApiDetailResponse<ExamSession>>(`${ADMIN_BASE}/sessions/`, data);
      return res.data.data;
    },

    async updateSession(publicId: string, data: ExamSessionUpdatePayload): Promise<ExamSession> {
      const res = await client.patch<ApiDetailResponse<ExamSession>>(
        `${ADMIN_BASE}/sessions/${publicId}/`,
        data
      );
      return res.data.data;
    },

    async deleteSession(publicId: string): Promise<void> {
      await client.delete(`${ADMIN_BASE}/sessions/${publicId}/`);
    },

    async reactivateSession(publicId: string): Promise<ExamSession> {
      const res = await client.post<ApiDetailResponse<ExamSession>>(
        `${ADMIN_BASE}/sessions/${publicId}/activate/`
      );
      return res.data.data;
    },

    async bulkUpdateExamStatusBySession(
      sessionId: string,
      status: string
    ): Promise<{ updated_count: number; status: string; session_id: string }> {
      const res = await client.post<
        ApiDetailResponse<{ updated_count: number; status: string; session_id: string }>
      >(`${ADMIN_BASE}/sessions/${sessionId}/bulk-update-exam-status/`, { status });
      return res.data.data;
    },

    // =========================================================================
    // Exams
    // =========================================================================

    async listExams(params?: ExamListParams): Promise<{
      data: Exam[];
      pagination?: ApiListResponse<Exam>['pagination'];
    }> {
      const baseUrl = getBaseUrl(isAdminUser());
      const res = await client.get<ApiListResponse<Exam>>(`${baseUrl}/exams/`, { params });
      return { data: res.data.data, pagination: res.data.pagination };
    },

    async getExam(publicId: string): Promise<Exam> {
      const baseUrl = getBaseUrl(isAdminUser());
      const res = await client.get<ApiDetailResponse<Exam>>(`${baseUrl}/exams/${publicId}/`);
      return res.data.data;
    },

    async createExam(data: ExamCreatePayload): Promise<Exam> {
      const res = await client.post<ApiDetailResponse<Exam>>(`${ADMIN_BASE}/exams/`, data);
      return res.data.data;
    },

    async bulkCreateExams(data: BulkExamCreatePayload): Promise<Exam[]> {
      const res = await client.post<ApiDetailResponse<Exam[]>>(`${ADMIN_BASE}/exams/bulk-create/`, data);
      return res.data.data;
    },

    async updateExam(publicId: string, data: ExamUpdatePayload): Promise<Exam> {
      const res = await client.patch<ApiDetailResponse<Exam>>(`${ADMIN_BASE}/exams/${publicId}/`, data);
      return res.data.data;
    },

    async deleteExam(publicId: string): Promise<void> {
      await client.delete(`${ADMIN_BASE}/exams/${publicId}/`);
    },

    async reactivateExam(publicId: string): Promise<Exam> {
      const res = await client.post<ApiDetailResponse<Exam>>(`${ADMIN_BASE}/exams/${publicId}/activate/`);
      return res.data.data;
    },

    // =========================================================================
    // Marks
    // =========================================================================

    async getExamMarks(examId: string): Promise<Mark[]> {
      const res = await client.get<ApiDetailResponse<Mark[]>>(`${EMPLOYEE_BASE}/marks/by-exam/`, {
        params: { exam_id: examId },
      });
      return res.data.data;
    },

    async bulkUpsertMarks(data: BulkMarkUpsertPayload): Promise<Mark[]> {
      const res = await client.post<{ success: boolean; data: Mark[] }>(
        `${EMPLOYEE_BASE}/marks/bulk-upsert/`,
        data
      );
      return res.data.data;
    },

    async getMarksOverview(params: {
      session_id: string;
      class_id: string;
    }): Promise<MarksOverviewResponse> {
      const res = await client.get<ApiDetailResponse<MarksOverviewResponse>>(
        `${EMPLOYEE_BASE}/marks/overview/`,
        { params }
      );
      return res.data.data;
    },

    async bulkSaveAllMarks(data: BulkSaveAllMarksPayload): Promise<{ count: number }> {
      const res = await client.post<ApiDetailResponse<{ count: number }>>(
        `${EMPLOYEE_BASE}/marks/bulk-save-all/`,
        data
      );
      return res.data.data;
    },
  };
}

export type ExamsApi = ReturnType<typeof createExamsApi>;
