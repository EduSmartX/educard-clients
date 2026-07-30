/**
 * Subjects Feature — API Layer
 *
 * Permission Model:
 * - Admin: Full CRUD access
 * - Teacher (Class Teacher): Can manage subjects in their assigned classes
 * - Teacher (Other): Read-only access
 */

import type {
  Subject,
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

export async function getSubjects(
  params?: SubjectQueryParams,
): Promise<SubjectListResponse> {
  const response = await apiClient.get<SubjectListResponse>(BASE_URL, {
    params,
  });
  return response.data;
}

export async function getSubjectById(
  publicId: string,
  isDeleted?: boolean,
): Promise<SubjectDetailResponse> {
  const response = await apiClient.get<SubjectDetailResponse>(
    `${BASE_URL}${publicId}/`,
    isDeleted ? { params: { is_deleted: true } } : undefined,
  );
  return response.data;
}

export async function createSubject(
  data: Partial<Subject>,
  forceCreate?: boolean,
): Promise<SubjectDetailResponse> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<SubjectDetailResponse>(BASE_URL, data, {
    params,
  });
  return response.data;
}

export async function updateSubject(
  publicId: string,
  data: Partial<Subject>,
): Promise<ApiMessageResponse> {
  const response = await apiClient.patch<ApiMessageResponse>(
    `${BASE_URL}${publicId}/`,
    data,
  );
  return response.data;
}

export async function deleteSubject(
  publicId: string,
): Promise<ApiMessageResponse> {
  return safeDelete(`${BASE_URL}${publicId}/`, 'Subject deleted successfully');
}

export async function restoreSubject(
  publicId: string,
): Promise<SubjectDetailResponse> {
  const response = await apiClient.post<SubjectDetailResponse>(
    `${BASE_URL}${publicId}/activate/`,
  );
  return response.data;
}

export async function getSubjectsByClass(
  classId: string,
): Promise<SubjectListResponse> {
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
  const { downloadAndSaveTemplate } = await import('@/utils/download-template');

  const response = await apiClient.get(`${BASE_URL}download-template/`, {
    responseType: 'arraybuffer',
  });

  return downloadAndSaveTemplate(
    response.data as ArrayBuffer,
    'subjects_template.xlsx',
  );
}

/**
 * Bulk upload subjects from Excel file
 */
export async function bulkUploadSubjects(
  fileUri: string,
  fileName: string,
): Promise<BulkUploadResponse> {
  return bulkUploadExcel(`${BASE_URL}bulk-upload/`, fileUri, fileName);
}
