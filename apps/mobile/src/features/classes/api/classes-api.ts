/**
 * Classes Feature — API Layer
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Class, ClassDetail, ApiListResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

export type ClassListResponse = ApiListResponse<Class>;

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

export async function getClassById(publicId: string, isDeleted?: boolean) {
  const response = await apiClient.get(
    API_ENDPOINTS.CLASSES.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createClass(data: Partial<Class>, forceCreate?: boolean) {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post(API_ENDPOINTS.CLASSES.CREATE, data, { params });
  return response.data;
}

export async function updateClass(publicId: string, data: Partial<Class>) {
  return apiClient.patch(API_ENDPOINTS.CLASSES.PATCH(publicId), data);
}

export async function deleteClass(publicId: string): Promise<void> {
  try {
    await apiClient.delete(API_ENDPOINTS.CLASSES.DELETE(publicId));
  } catch (error: any) {
    const status = error?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (error?.message === 'Network Error' && !error?.response) return;
    throw error;
  }
}

export async function restoreClass(publicId: string) {
  const response = await apiClient.post(`${API_ENDPOINTS.CLASSES.DETAIL(publicId)}activate/`);
  return response.data;
}
