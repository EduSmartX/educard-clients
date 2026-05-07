/**
 * Students API
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Student, ApiListResponse, ApiDetailResponse } from '@educard/shared';

import { apiClient } from '@/api/client';

export type StudentListResponse = ApiListResponse<Student>;
export type StudentDetailResponse = ApiDetailResponse<Student>;

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

export async function getStudentById(
  publicId: string,
  isDeleted?: boolean
): Promise<StudentDetailResponse> {
  const response = await apiClient.get<StudentDetailResponse>(
    API_ENDPOINTS.STUDENTS.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createStudent(
  data: Partial<Student>,
  forceCreate?: boolean
): Promise<StudentDetailResponse> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<StudentDetailResponse>(
    API_ENDPOINTS.STUDENTS.CREATE,
    data,
    { params }
  );
  return response.data;
}

export async function updateStudent(publicId: string, data: Partial<Student>): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.STUDENTS.PATCH(publicId), data);
}

export async function deleteStudent(publicId: string, classId?: string): Promise<void> {
  try {
    const url = classId
      ? API_ENDPOINTS.STUDENTS.CLASS_LEVEL.DELETE(classId, publicId)
      : API_ENDPOINTS.STUDENTS.DELETE(publicId);
    await apiClient.delete(url);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

export async function restoreStudent(
  publicId: string,
  classId?: string
): Promise<StudentDetailResponse> {
  const url = classId
    ? API_ENDPOINTS.STUDENTS.CLASS_LEVEL.ACTIVATE(classId, publicId)
    : `${API_ENDPOINTS.STUDENTS.DETAIL(publicId)}activate/`;
  const response = await apiClient.post<StudentDetailResponse>(url);
  return response.data;
}
