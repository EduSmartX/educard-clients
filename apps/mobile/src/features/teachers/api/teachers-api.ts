/**
 * Teachers Feature — API Layer
 * All API calls for teacher CRUD operations
 */

import type {
  Teacher,
  TeacherDetail,
  CreateTeacherPayload,
  ApiListResponse,
  ApiDetailResponse,
} from '@educard/shared';

import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/constants';

export type TeacherListResponse = ApiListResponse<Teacher>;

export interface TeacherQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_deleted?: boolean;
  gender?: string;
  designation?: string;
}

export async function getTeachers(params?: TeacherQueryParams): Promise<TeacherListResponse> {
  const response = await apiClient.get<TeacherListResponse>(API_ENDPOINTS.TEACHERS.LIST, {
    params,
  });
  return response.data;
}

export async function getTeacherById(
  publicId: string,
  isDeleted?: boolean
): Promise<ApiDetailResponse<TeacherDetail>> {
  const response = await apiClient.get<ApiDetailResponse<TeacherDetail>>(
    API_ENDPOINTS.TEACHERS.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createTeacher(
  data: CreateTeacherPayload,
  forceCreate?: boolean
): Promise<ApiDetailResponse<TeacherDetail>> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<ApiDetailResponse<TeacherDetail>>(
    API_ENDPOINTS.TEACHERS.CREATE,
    data,
    { params }
  );
  return response.data;
}

export async function updateTeacher(
  publicId: string,
  data: Partial<CreateTeacherPayload>
): Promise<ApiDetailResponse<TeacherDetail>> {
  const response = await apiClient.patch<ApiDetailResponse<TeacherDetail>>(
    API_ENDPOINTS.TEACHERS.PATCH(publicId),
    data
  );
  return response.data;
}

export async function deleteTeacher(publicId: string): Promise<void> {
  try {
    await apiClient.delete(API_ENDPOINTS.TEACHERS.DELETE(publicId));
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

export async function restoreTeacher(publicId: string): Promise<ApiDetailResponse<Teacher>> {
  const response = await apiClient.post<ApiDetailResponse<Teacher>>(
    `${API_ENDPOINTS.TEACHERS.DETAIL(publicId)}activate/`
  );
  return response.data;
}
