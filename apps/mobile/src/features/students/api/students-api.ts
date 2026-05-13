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
  embed_images?: boolean;
}

export async function getStudents(params?: StudentQueryParams): Promise<StudentListResponse> {
  // By default, embed images to reduce HTTP requests (Base64 data URIs)
  const queryParams = { embed_images: true, ...params };
  const response = await apiClient.get<StudentListResponse>(API_ENDPOINTS.STUDENTS.LIST, {
    params: queryParams,
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
  data: Partial<Student> & { class_id: string },
  forceCreate?: boolean
): Promise<StudentDetailResponse> {
  // Students must be created via class-level endpoint
  const classId = data.class_id;
  if (!classId) {
    throw new Error('class_id is required to create a student');
  }
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<StudentDetailResponse>(
    API_ENDPOINTS.STUDENTS.CLASS_LEVEL.CREATE(classId),
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

/**
 * Download student bulk import template and save to Downloads folder
 */
export async function downloadStudentTemplate(minimalFields = false): Promise<{
  success: boolean;
  message: string;
  filePath?: string;
}> {
  // Import dynamically to avoid circular dependencies
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  const params = minimalFields ? { minimal_fields: 'true' } : {};
  const response = await apiClient.get('/students/bulk-operations/download_template/', {
    params,
    responseType: 'arraybuffer',
  });

  const fileName = minimalFields ? 'students_template_minimal.xlsx' : 'students_template.xlsx';
  return downloadAndSaveTemplate(response.data as ArrayBuffer, fileName);
}

/**
 * Bulk upload students from Excel file
 */
export async function bulkUploadStudents(
  fileUri: string,
  fileName: string,
  minimalFields = false
): Promise<{
  success: boolean;
  message: string;
  data: {
    created_count?: number;
    successful_count?: number;
    failed_count: number;
    total_rows?: number;
    errors: { row: number; error: string; data?: Record<string, unknown> | null }[];
  };
  code: number;
}> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  } as unknown as Blob);

  const params = minimalFields ? { minimal_fields: 'true' } : {};
  const response = await apiClient.post('/students/bulk-operations/bulk_upload/', formData, {
    params,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
