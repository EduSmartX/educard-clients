/**
 * Homework API — Employee endpoints for Teachers
 *
 * NOTE: Types are now imported directly from @educard/shared
 */

import type {
  Homework,
  HomeworkDetail,
  HomeworkSubmissionDetail,
  HomeworkDashboardStats,
  CalendarHomework,
  TeacherClass,
  HomeworkCreatePayload,
  HomeworkUpdatePayload,
  ReviewSubmissionPayload,
  HomeworkListParams,
  SubmissionListParams,
  CalendarParams,
  SubmissionsResponse,
} from '@educard/shared';

import { apiClient } from '@/api/client';

const BASE_URL = '/homework';

interface DetailResponse<T> {
  success: boolean;
  data: T;
}

// ============== Teacher Classes ==============

export async function fetchTeacherClasses(): Promise<TeacherClass[]> {
  const res = await apiClient.get<DetailResponse<TeacherClass[]>>(
    `${BASE_URL}/classes/`,
  );
  return res.data.data;
}

// ============== Dashboard ==============

export async function fetchHomeworkDashboard(): Promise<HomeworkDashboardStats> {
  const res = await apiClient.get<DetailResponse<HomeworkDashboardStats>>(
    `${BASE_URL}/dashboard/`,
  );
  return res.data.data;
}

export async function fetchUpcomingHomework(): Promise<Homework[]> {
  const res = await apiClient.get<DetailResponse<Homework[]>>(
    `${BASE_URL}/upcoming/`,
  );
  return res.data.data;
}

// ============== Homework — Queries ==============

export async function fetchHomeworkList(
  params?: HomeworkListParams,
): Promise<Homework[]> {
  const res = await apiClient.get<DetailResponse<Homework[]>>(`${BASE_URL}/`, {
    params,
  });
  return res.data.data;
}

export async function fetchHomeworkDetail(
  publicId: string,
): Promise<HomeworkDetail> {
  const res = await apiClient.get<DetailResponse<HomeworkDetail>>(
    `${BASE_URL}/${publicId}/`,
  );
  return res.data.data;
}

// ============== Homework — Mutations ==============

export async function createHomework(
  data: HomeworkCreatePayload,
): Promise<HomeworkDetail> {
  const res = await apiClient.post<DetailResponse<HomeworkDetail>>(
    `${BASE_URL}/`,
    data,
  );
  return res.data.data;
}

export async function updateHomework(
  publicId: string,
  data: HomeworkUpdatePayload,
): Promise<HomeworkDetail> {
  const res = await apiClient.patch<DetailResponse<HomeworkDetail>>(
    `${BASE_URL}/${publicId}/`,
    data,
  );
  return res.data.data;
}

export async function deleteHomework(publicId: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${publicId}/`);
}

// ============== Attachments ==============

export async function uploadHomeworkAttachment(
  publicId: string,
  formData: FormData,
): Promise<void> {
  await apiClient.post(`${BASE_URL}/${publicId}/attachments/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function deleteHomeworkAttachment(
  homeworkPublicId: string,
  attachmentPublicId: string,
): Promise<void> {
  await apiClient.delete(
    `${BASE_URL}/${homeworkPublicId}/attachments/${attachmentPublicId}/`,
  );
}

// ============== Submissions ==============

export async function fetchSubmissions(
  homeworkPublicId: string,
  params?: SubmissionListParams,
): Promise<SubmissionsResponse> {
  const res = await apiClient.get<DetailResponse<SubmissionsResponse>>(
    `${BASE_URL}/${homeworkPublicId}/submissions/`,
    { params },
  );
  return res.data.data;
}

export async function fetchSubmissionDetail(
  homeworkPublicId: string,
  submissionPublicId: string,
): Promise<HomeworkSubmissionDetail> {
  const res = await apiClient.get<DetailResponse<HomeworkSubmissionDetail>>(
    `${BASE_URL}/${homeworkPublicId}/submissions/${submissionPublicId}/`,
  );
  return res.data.data;
}

export async function reviewSubmission(
  homeworkPublicId: string,
  submissionPublicId: string,
  data: ReviewSubmissionPayload,
): Promise<HomeworkSubmissionDetail> {
  const res = await apiClient.post<DetailResponse<HomeworkSubmissionDetail>>(
    `${BASE_URL}/${homeworkPublicId}/submissions/${submissionPublicId}/review/`,
    data,
  );
  return res.data.data;
}

// ============== Calendar ==============

export async function fetchCalendarHomework(
  params?: CalendarParams,
): Promise<CalendarHomework[]> {
  const res = await apiClient.get<DetailResponse<CalendarHomework[]>>(
    `${BASE_URL}/calendar/`,
    {
      params,
    },
  );
  return res.data.data;
}

// ============== Notifications ==============

export async function sendHomeworkNotification(data: {
  class_public_id: string;
  date: string;
}): Promise<void> {
  await apiClient.post(`${BASE_URL}/notify/`, data);
}
