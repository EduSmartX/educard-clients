/**
 * Subjects Feature — API Layer
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Subject, ApiListResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

export type SubjectListResponse = ApiListResponse<Subject>;

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

export async function getSubjectById(publicId: string, isDeleted?: boolean) {
  const response = await apiClient.get(
    API_ENDPOINTS.SUBJECTS.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createSubject(data: Partial<Subject>, forceCreate?: boolean) {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post(API_ENDPOINTS.SUBJECTS.CREATE, data, { params });
  return response.data;
}

export async function updateSubject(publicId: string, data: Partial<Subject>) {
  return apiClient.patch(API_ENDPOINTS.SUBJECTS.PATCH(publicId), data);
}

export async function deleteSubject(publicId: string): Promise<void> {
  try {
    await apiClient.delete(API_ENDPOINTS.SUBJECTS.DELETE(publicId));
  } catch (error: any) {
    const status = error?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (error?.message === 'Network Error' && !error?.response) return;
    throw error;
  }
}

export async function restoreSubject(publicId: string) {
  const response = await apiClient.post(`${API_ENDPOINTS.SUBJECTS.DETAIL(publicId)}activate/`);
  return response.data;
}

export async function getSubjectsByClass(classId: string) {
  return apiClient.get(API_ENDPOINTS.SUBJECTS.BY_CLASS, { params: { class_id: classId } });
}
