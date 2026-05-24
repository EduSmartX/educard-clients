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

import type {
  Subject,
  ApiListResponse,
  ApiDetailResponse,
  ApiMessageResponse,
} from '@educard/shared';

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

export async function updateSubject(
  publicId: string,
  data: Partial<Subject>
): Promise<ApiMessageResponse> {
  const response = await apiClient.patch<ApiMessageResponse>(`${BASE_URL}${publicId}/`, data);
  return response.data;
}

export async function deleteSubject(publicId: string): Promise<ApiMessageResponse> {
  try {
    const response = await apiClient.delete<ApiMessageResponse>(`${BASE_URL}${publicId}/`);
    return response.data || { success: true, message: 'Subject deleted successfully' };
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300)
      return { success: true, message: 'Subject deleted successfully' };
    if (axiosError?.message === 'Network Error' && !axiosError?.response)
      return { success: true, message: 'Subject deleted successfully' };
    throw error;
  }
}

export async function restoreSubject(publicId: string): Promise<SubjectDetailResponse> {
  const response = await apiClient.post<SubjectDetailResponse>(`${BASE_URL}${publicId}/activate/`);
  return response.data;
}

export async function getSubjectsByClass(classId: string): Promise<SubjectListResponse> {
  const response = await apiClient.get<SubjectListResponse>(BASE_URL, {
    params: { class_assigned: classId, page_size: 100 },
  });
  return response.data;
}

/**
 * Download subject bulk import template and save to Downloads folder
 */
export async function downloadSubjectTemplate(): Promise<{
  success: boolean;
  message: string;
  filePath?: string;
}> {
  // Import dynamically to avoid circular dependencies
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  const response = await apiClient.get(`${BASE_URL}download-template/`, {
    responseType: 'arraybuffer',
  });

  return downloadAndSaveTemplate(response.data as ArrayBuffer, 'subjects_template.xlsx');
}

/**
 * Bulk upload subjects from Excel file
 */
export async function bulkUploadSubjects(
  fileUri: string,
  fileName: string
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

  const response = await apiClient.post<{
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
  }>(`${BASE_URL}bulk-upload/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
