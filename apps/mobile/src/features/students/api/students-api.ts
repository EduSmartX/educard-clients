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
import {
  safeDelete,
  bulkUploadExcel,
  type BulkUploadResponse,
} from '@/api/shared-api-utils';

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

export async function getStudents(
  params?: StudentQueryParams,
): Promise<StudentListResponse> {
  const queryParams = { embed_images: true, ...params };
  const response = await apiClient.get<StudentListResponse>(
    API_ENDPOINTS.STUDENTS.LIST,
    {
      params: queryParams,
    },
  );
  return response.data;
}

export async function getStudentById(
  publicId: string,
  isDeleted?: boolean,
): Promise<StudentDetailResponse> {
  const response = await apiClient.get<StudentDetailResponse>(
    API_ENDPOINTS.STUDENTS.DETAIL(publicId),
    isDeleted ? { params: { is_deleted: true } } : undefined,
  );
  return response.data;
}

export async function createStudent(
  data: Partial<Student> & { class_id: string },
  forceCreate?: boolean,
): Promise<StudentDetailResponse> {
  const classId = data.class_id;
  if (!classId) {
    throw new Error('class_id is required to create a student');
  }
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<StudentDetailResponse>(
    API_ENDPOINTS.STUDENTS.CLASS_LEVEL.CREATE(classId),
    data,
    { params },
  );
  return response.data;
}

export async function updateStudent(
  publicId: string,
  data: Partial<Student>,
): Promise<ApiMessageResponse> {
  const response = await apiClient.patch<ApiMessageResponse>(
    API_ENDPOINTS.STUDENTS.PATCH(publicId),
    data,
  );
  return response.data;
}

export async function deleteStudent(
  publicId: string,
  classId?: string,
): Promise<ApiMessageResponse> {
  const url = classId
    ? API_ENDPOINTS.STUDENTS.CLASS_LEVEL.DELETE(classId, publicId)
    : API_ENDPOINTS.STUDENTS.DELETE(publicId);
  return safeDelete(url, 'Student deleted successfully');
}

export async function restoreStudent(
  publicId: string,
  classId?: string,
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
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  const params = minimalFields ? { minimal_fields: 'true' } : {};
  const response = await apiClient.get(
    '/students/bulk-operations/download_template/',
    {
      params,
      responseType: 'arraybuffer',
    },
  );

  const fileName = minimalFields
    ? 'students_template_minimal.xlsx'
    : 'students_template.xlsx';
  return downloadAndSaveTemplate(response.data as ArrayBuffer, fileName);
}

/**
 * Bulk upload students from Excel file
 */
export async function bulkUploadStudents(
  fileUri: string,
  fileName: string,
  minimalFields = false,
): Promise<BulkUploadResponse> {
  const params = minimalFields ? { minimal_fields: 'true' } : undefined;
  return bulkUploadExcel(
    '/students/bulk-operations/bulk_upload/',
    fileUri,
    fileName,
    params,
  );
}

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
 */
function extractArrayBufferErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof ArrayBuffer && data.byteLength > 0) {
    try {
      const bytes = new Uint8Array(data);
      let text = '';
      for (let i = 0; i < bytes.length; i += 1) {
        text += String.fromCharCode(bytes[i]);
      }
      const json = JSON.parse(text) as { message?: string; detail?: string };
      return json.message || json.detail || fallback;
    } catch {
      // response body was not JSON
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export async function exportStudentsData(
  payload: ExportStudentsPayload = {},
): Promise<{ success: boolean; message: string; filePath?: string }> {
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  try {
    const response = await apiClient.post(
      '/students/bulk-operations/export_students_data/',
      payload,
      { responseType: 'arraybuffer' },
    );

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `students_export_${timestamp}.xlsx`;
    return downloadAndSaveTemplate(response.data as ArrayBuffer, fileName);
  } catch (error) {
    throw new Error(
      extractArrayBufferErrorMessage(error, 'Export failed. Please try again.'),
    );
  }
}

export interface ResetClassPasswordsPayload {
  new_password: string;
  confirm_password: string;
}

export async function resetClassPasswords(
  classId: string,
  payload: ResetClassPasswordsPayload,
): Promise<{ success: boolean; message: string; filePath?: string }> {
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  try {
    const response = await apiClient.post(
      `/students/classes/${classId}/students/reset-passwords/`,
      payload,
      { responseType: 'arraybuffer' },
    );

    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `class_credentials_${timestamp}.xlsx`;
    return downloadAndSaveTemplate(response.data as ArrayBuffer, fileName);
  } catch (error) {
    throw new Error(
      extractArrayBufferErrorMessage(
        error,
        'Failed to reset passwords. Please try again.',
      ),
    );
  }
}

export async function fetchDefaultStudentPassword(): Promise<string> {
  const response = await apiClient.get(
    '/students/bulk-operations/default_password/',
  );
  const data = response.data as { data?: { default_password?: string } };
  return data?.data?.default_password ?? '';
}
