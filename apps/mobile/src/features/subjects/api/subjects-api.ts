/**
 * Subjects Feature — API Layer
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Subject, ApiListResponse, ApiDetailResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

export type SubjectListResponse = ApiListResponse<Subject>;
export type SubjectDetailResponse = ApiDetailResponse<Subject>;

export interface SubjectQueryParams {
  search?: string;
  class_id?: string;
  class_assigned?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export async function getSubjects(params?: SubjectQueryParams): Promise<SubjectListResponse> {
  const response = await apiClient.get<SubjectListResponse>(API_ENDPOINTS.SUBJECTS.LIST, {
    params,
  });
  return response.data;
}

export async function getSubjectById(
  publicId: string,
  isDeleted?: boolean
): Promise<SubjectDetailResponse> {
  const response = await apiClient.get<SubjectDetailResponse>(
    API_ENDPOINTS.SUBJECTS.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createSubject(
  data: Partial<Subject>,
  forceCreate?: boolean
): Promise<SubjectDetailResponse> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<SubjectDetailResponse>(
    API_ENDPOINTS.SUBJECTS.CREATE,
    data,
    { params }
  );
  return response.data;
}

export async function updateSubject(publicId: string, data: Partial<Subject>): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.SUBJECTS.PATCH(publicId), data);
}

export async function deleteSubject(publicId: string): Promise<void> {
  try {
    await apiClient.delete(API_ENDPOINTS.SUBJECTS.DELETE(publicId));
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

export async function restoreSubject(publicId: string): Promise<SubjectDetailResponse> {
  const response = await apiClient.post<SubjectDetailResponse>(
    `${API_ENDPOINTS.SUBJECTS.DETAIL(publicId)}activate/`
  );
  return response.data;
}

export async function getSubjectsByClass(classId: string): Promise<SubjectListResponse> {
  const response = await apiClient.get<SubjectListResponse>(API_ENDPOINTS.SUBJECTS.BY_CLASS, {
    params: { class_id: classId },
  });
  return response.data;
}
