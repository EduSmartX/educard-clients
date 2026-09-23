/**
 * Homework API
 */

import api from '@/lib/api';
import { API_CONFIG } from '@educard/shared';
import type {
  Homework,
  HomeworkDetail,
  HomeworkCreatePayload,
  HomeworkUpdatePayload,
  HomeworkAttachment,
  HomeworkSubmission,
  HomeworkSubmissionDetail,
  ReviewSubmissionPayload,
  HomeworkDashboardStats,
  CalendarHomework,
  TeacherClass,
  HomeworkListParams,
  SubmissionListParams,
  CalendarParams,
  SubmissionStats,
} from '../types';

const BASE_URL = '/homework';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SubmissionsResponse {
  submissions: HomeworkSubmission[];
  stats: SubmissionStats;
}

export async function fetchDashboardStats(): Promise<HomeworkDashboardStats> {
  const response = await api.get<ApiResponse<HomeworkDashboardStats>>(`${BASE_URL}/dashboard/`);
  return response.data.data;
}

export async function fetchCalendarHomework(params?: CalendarParams): Promise<CalendarHomework[]> {
  const response = await api.get<ApiResponse<CalendarHomework[]>>(`${BASE_URL}/calendar/`, {
    params,
  });
  return response.data.data;
}

export async function fetchUpcomingHomework(days?: number): Promise<Homework[]> {
  const response = await api.get<ApiResponse<Homework[]>>(`${BASE_URL}/upcoming/`, {
    params: { days },
  });
  return response.data.data;
}

export async function fetchTeacherClasses(): Promise<TeacherClass[]> {
  const response = await api.get<ApiResponse<TeacherClass[]>>(`${BASE_URL}/classes/`);
  return response.data.data;
}

export async function fetchHomeworkList(params?: HomeworkListParams): Promise<Homework[]> {
  const response = await api.get<ApiResponse<Homework[]>>(`${BASE_URL}/`, { params });
  return response.data.data;
}

export async function fetchHomeworkDetail(publicId: string): Promise<HomeworkDetail> {
  const response = await api.get<ApiResponse<HomeworkDetail>>(`${BASE_URL}/${publicId}/`);
  return response.data.data;
}

export async function createHomework(data: HomeworkCreatePayload): Promise<HomeworkDetail> {
  const response = await api.post<ApiResponse<HomeworkDetail>>(`${BASE_URL}/`, data, {
    timeout: API_CONFIG.HEAVY_TIMEOUT,
  });
  return response.data.data;
}

export interface BulkCreateHomeworkResponse {
  created: HomeworkDetail[];
  created_count: number;
  errors: Array<{ index: number; error: string }>;
}

export async function bulkCreateHomework(
  items: HomeworkCreatePayload[]
): Promise<BulkCreateHomeworkResponse> {
  const response = await api.post<ApiResponse<BulkCreateHomeworkResponse>>(
    `${BASE_URL}/bulk/`,
    { items },
    { timeout: API_CONFIG.HEAVY_TIMEOUT }
  );
  return response.data.data;
}

export async function updateHomework(
  publicId: string,
  data: HomeworkUpdatePayload
): Promise<HomeworkDetail> {
  const response = await api.patch<ApiResponse<HomeworkDetail>>(`${BASE_URL}/${publicId}/`, data);
  return response.data.data;
}

export async function deleteHomework(publicId: string): Promise<void> {
  await api.delete(`${BASE_URL}/${publicId}/`);
}

export async function uploadAttachment(
  homeworkPublicId: string,
  file: File,
  fileName?: string
): Promise<HomeworkAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  if (fileName) {
    formData.append('file_name', fileName);
  }

  const response = await api.post<ApiResponse<HomeworkAttachment>>(
    `${BASE_URL}/${homeworkPublicId}/attachments/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
}

export async function deleteAttachment(
  homeworkPublicId: string,
  attachmentId: string
): Promise<void> {
  await api.delete(`${BASE_URL}/${homeworkPublicId}/attachments/${attachmentId}/`);
}

export async function fetchSubmissions(
  homeworkPublicId: string,
  params?: SubmissionListParams
): Promise<SubmissionsResponse> {
  const response = await api.get<ApiResponse<SubmissionsResponse>>(
    `${BASE_URL}/${homeworkPublicId}/submissions/`,
    { params }
  );
  return response.data.data;
}

export async function fetchSubmissionDetail(
  homeworkPublicId: string,
  submissionId: string
): Promise<HomeworkSubmissionDetail> {
  const response = await api.get<ApiResponse<HomeworkSubmissionDetail>>(
    `${BASE_URL}/${homeworkPublicId}/submissions/${submissionId}/`
  );
  return response.data.data;
}

export async function reviewSubmission(
  homeworkPublicId: string,
  submissionId: string,
  data: ReviewSubmissionPayload
): Promise<HomeworkSubmissionDetail> {
  const response = await api.post<ApiResponse<HomeworkSubmissionDetail>>(
    `${BASE_URL}/${homeworkPublicId}/submissions/${submissionId}/review/`,
    data
  );
  return response.data.data;
}

export async function fetchClassHomework(
  classPublicId: string,
  params?: { status?: string; subject_public_id?: string }
): Promise<Homework[]> {
  const response = await api.get<ApiResponse<Homework[]>>(`${BASE_URL}/class/${classPublicId}/`, {
    params,
  });
  return response.data.data;
}

export async function sendHomeworkNotification(data: {
  class_public_id: string;
  date: string;
}): Promise<void> {
  await api.post(`${BASE_URL}/notify/`, data);
}
