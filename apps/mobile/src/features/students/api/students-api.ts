/**
 * Students API
 */

import { API_ENDPOINTS } from '@educard/shared';
import type {
  Student,
  ApiListResponse,
  ApiDetailResponse,
  ApiMessageResponse,
} from '@educard/shared';

import { apiClient } from '@/api/client';
import { safeDelete, bulkUploadExcel, type BulkUploadResponse } from '@/api/shared-api-utils';

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

export async function updateStudent(
  publicId: string,
  data: Partial<Student>
): Promise<ApiMessageResponse> {
  const response = await apiClient.patch<ApiMessageResponse>(
    API_ENDPOINTS.STUDENTS.PATCH(publicId),
    data
  );
  return response.data;
}

export async function deleteStudent(
  publicId: string,
  classId?: string
): Promise<ApiMessageResponse> {
  const url = classId
    ? API_ENDPOINTS.STUDENTS.CLASS_LEVEL.DELETE(classId, publicId)
    : API_ENDPOINTS.STUDENTS.DELETE(publicId);
  return safeDelete(url, 'Student deleted successfully');
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
): Promise<BulkUploadResponse> {
  const params = minimalFields ? { minimal_fields: 'true' } : undefined;
  return bulkUploadExcel('/students/bulk-operations/bulk_upload/', fileUri, fileName, params);
}

/**
 * Export students data payload
 */
export interface ExportStudentsPayload {
  class_id?: string;
  class_ids?: string[];
  gender?: string;
  search?: string;
  send_email?: boolean;
  emails?: string[];
}

/**
 * Export students data as Excel and optionally send via email.
 * Returns the file saved to device.
 */
export async function exportStudentsData(
  payload: ExportStudentsPayload = {}
): Promise<{ success: boolean; message: string; filePath?: string }> {
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  const response = await apiClient.post(
    '/students/bulk-operations/export_students_data/',
    payload,
    {
      responseType: 'arraybuffer',
    }
  );

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `students_export_${timestamp}.xlsx`;
  return downloadAndSaveTemplate(response.data as ArrayBuffer, fileName);
}
