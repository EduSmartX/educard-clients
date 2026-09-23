/**
 * Classes Feature — API Layer
 *
 * Permission Model:
 * - Admin: Full CRUD access via /classes/admin/ endpoints
 * - Teacher: Read-only access via /classes/employee/ endpoints
 */

import type {
  Class,
  ClassDetail,
  ApiListResponse,
  ApiDetailResponse,
  ApiMessageResponse,
} from '@educard/shared';

import { apiClient } from '@/api/client';
import {
  createRoleBasedUrlResolver,
  safeDeleteVoid,
  bulkUploadExcel,
  type BulkUploadResponse,
} from '@/api/shared-api-utils';

const ADMIN_BASE_URL = '/classes/admin/';
const EMPLOYEE_BASE_URL = '/classes/employee/';

const getBaseUrl = createRoleBasedUrlResolver(
  ADMIN_BASE_URL,
  EMPLOYEE_BASE_URL,
);

export type ClassListResponse = ApiListResponse<Class>;
export type ClassDetailResponse = ApiDetailResponse<ClassDetail>;

export interface ClassQueryParams {
  search?: string;
  grade?: string;
  academic_year?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
  for_student_form?: boolean;
  for_subject_form?: boolean;
}

export async function getClasses(
  params?: ClassQueryParams,
  userRole?: string | null,
): Promise<ClassListResponse> {
  const baseUrl = getBaseUrl(userRole, false);
  const response = await apiClient.get<ClassListResponse>(baseUrl, { params });
  return response.data;
}

export async function getClassById(
  publicId: string,
  isDeleted?: boolean,
  userRole?: string | null,
): Promise<ClassDetailResponse> {
  const baseUrl = getBaseUrl(userRole, false);
  const response = await apiClient.get<ClassDetailResponse>(
    `${baseUrl}${publicId}/`,
    isDeleted ? { params: { is_deleted: true } } : undefined,
  );
  return response.data;
}

export async function createClass(
  data: Partial<Class>,
  forceCreate?: boolean,
): Promise<ClassDetailResponse> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<ClassDetailResponse>(
    ADMIN_BASE_URL,
    data,
    { params },
  );
  return response.data;
}

export async function updateClass(
  publicId: string,
  data: Partial<Class>,
): Promise<ApiMessageResponse> {
  const response = await apiClient.patch<ApiMessageResponse>(
    `${ADMIN_BASE_URL}${publicId}/`,
    data,
  );
  return response.data;
}

export async function deleteClass(publicId: string): Promise<void> {
  return safeDeleteVoid(`${ADMIN_BASE_URL}${publicId}/`);
}

export async function restoreClass(
  publicId: string,
): Promise<ClassDetailResponse> {
  const response = await apiClient.post<ClassDetailResponse>(
    `${ADMIN_BASE_URL}${publicId}/activate/`,
  );
  return response.data;
}

/**
 * Download class bulk import template
 */
export async function downloadClassTemplate(): Promise<ArrayBuffer> {
  const response = await apiClient.get<ArrayBuffer>(
    `${ADMIN_BASE_URL}download-template/`,
    {
      responseType: 'arraybuffer',
    },
  );
  return response.data;
}

/**
 * Bulk upload classes from Excel file
 */
export async function bulkUploadClasses(
  fileUri: string,
  fileName: string,
): Promise<BulkUploadResponse> {
  return bulkUploadExcel(`${ADMIN_BASE_URL}bulk-upload/`, fileUri, fileName);
}
