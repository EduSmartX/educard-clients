/**
 * Students API
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Student, ApiListResponse, ApiDetailResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

export type StudentListResponse = ApiListResponse<Student>;

export interface StudentQueryParams {
  search?: string;
  class_id?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  is_active?: boolean;
}

export async function getStudents(params?: StudentQueryParams): Promise<StudentListResponse> {
  const response = await apiClient.get<StudentListResponse>(API_ENDPOINTS.STUDENTS.LIST, {
    params,
  });
  return response.data;
}

export async function getStudentById(publicId: string, isDeleted?: boolean) {
  const response = await apiClient.get(
    API_ENDPOINTS.STUDENTS.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createStudent(data: Partial<Student>, forceCreate?: boolean) {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post(API_ENDPOINTS.STUDENTS.CREATE, data, { params });
  return response.data;
}

export async function updateStudent(publicId: string, data: Partial<Student>) {
  return apiClient.patch(API_ENDPOINTS.STUDENTS.PATCH(publicId), data);
}

export async function deleteStudent(publicId: string, classId?: string): Promise<void> {
  try {
    const url = classId
      ? API_ENDPOINTS.STUDENTS.CLASS_LEVEL.DELETE(classId, publicId)
      : API_ENDPOINTS.STUDENTS.DELETE(publicId);
    await apiClient.delete(url);
  } catch (error: any) {
    const status = error?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (error?.message === 'Network Error' && !error?.response) return;
    throw error;
  }
}

export async function restoreStudent(publicId: string, classId?: string) {
  const url = classId
    ? API_ENDPOINTS.STUDENTS.CLASS_LEVEL.ACTIVATE(classId, publicId)
    : `${API_ENDPOINTS.STUDENTS.DETAIL(publicId)}activate/`;
  const response = await apiClient.post(url);
  return response.data;
}
