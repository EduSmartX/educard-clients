/**
 * Classes Feature — API Layer
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Class, ApiListResponse, ApiDetailResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

export type ClassListResponse = ApiListResponse<Class>;
export type ClassDetailResponse = ApiDetailResponse<Class>;

export interface ClassQueryParams {
  search?: string;
  grade?: string;
  academic_year?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export async function getClasses(params?: ClassQueryParams): Promise<ClassListResponse> {
  const response = await apiClient.get<ClassListResponse>(API_ENDPOINTS.CLASSES.LIST, { params });
  return response.data;
}

export async function getClassById(
  publicId: string,
  isDeleted?: boolean
): Promise<ClassDetailResponse> {
  const response = await apiClient.get<ClassDetailResponse>(
    API_ENDPOINTS.CLASSES.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createClass(
  data: Partial<Class>,
  forceCreate?: boolean
): Promise<ClassDetailResponse> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<ClassDetailResponse>(API_ENDPOINTS.CLASSES.CREATE, data, {
    params,
  });
  return response.data;
}

export async function updateClass(publicId: string, data: Partial<Class>): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.CLASSES.PATCH(publicId), data);
}

export async function deleteClass(publicId: string): Promise<void> {
  try {
    await apiClient.delete(API_ENDPOINTS.CLASSES.DELETE(publicId));
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

export async function restoreClass(publicId: string): Promise<ClassDetailResponse> {
  const response = await apiClient.post<ClassDetailResponse>(
    `${API_ENDPOINTS.CLASSES.DETAIL(publicId)}activate/`
  );
  return response.data;
}
