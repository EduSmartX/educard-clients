/**
 * Subjects Feature — API Layer
 *
 * Permission Model:
 * - Admin: Full CRUD access
 * - Teacher (Class Teacher): Can manage subjects in their assigned classes
 * - Teacher (Other): Read-only access
 *
 * The backend returns `can_manage` field indicating whether the user can edit/delete
 */

// import { API_ENDPOINTS } from '@educard/shared'; // unused - keeping for future reference
import type { Subject, ApiListResponse, ApiDetailResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

// Subjects use a single endpoint, backend handles permissions via can_manage field
const BASE_URL = '/subjects/';

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
  is_deleted?: boolean;
}

export async function getSubjects(params?: SubjectQueryParams): Promise<SubjectListResponse> {
  const response = await apiClient.get<SubjectListResponse>(BASE_URL, {
    params,
  });
  // Backend returns can_manage field per subject based on user role
  return response.data;
}

export async function getSubjectById(
  publicId: string,
  isDeleted?: boolean
): Promise<SubjectDetailResponse> {
  const response = await apiClient.get<SubjectDetailResponse>(
    `${BASE_URL}${publicId}/`,
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createSubject(
  data: Partial<Subject>,
  forceCreate?: boolean
): Promise<SubjectDetailResponse> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<SubjectDetailResponse>(BASE_URL, data, { params });
  return response.data;
}

export async function updateSubject(publicId: string, data: Partial<Subject>): Promise<void> {
  await apiClient.patch(`${BASE_URL}${publicId}/`, data);
}

export async function deleteSubject(publicId: string): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}${publicId}/`);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

export async function restoreSubject(publicId: string): Promise<SubjectDetailResponse> {
  const response = await apiClient.post<SubjectDetailResponse>(`${BASE_URL}${publicId}/activate/`);
  return response.data;
}

export async function getSubjectsByClass(classId: string): Promise<SubjectListResponse> {
  const response = await apiClient.get<SubjectListResponse>(BASE_URL, {
    params: { class_assigned: classId },
  });
  return response.data;
}
