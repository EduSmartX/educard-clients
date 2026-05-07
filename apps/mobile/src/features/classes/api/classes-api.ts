/**
 * Classes Feature — API Layer
 * 
 * Permission Model:
 * - Admin: Full CRUD access via /classes/admin/ endpoints
 * - Teacher: Read-only access via /classes/employee/ endpoints
 */

import { API_ENDPOINTS } from '@educard/shared';
import type { Class, ApiListResponse, ApiDetailResponse } from '@educard/shared';

import { apiClient } from '@/api/client';
import { isAdminRole } from '@/utils/role-utils';

// Admin endpoints - Full CRUD operations
const ADMIN_BASE_URL = '/classes/admin/';
// Employee endpoints - Read-only access
const EMPLOYEE_BASE_URL = '/classes/employee/';

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
  // For filtering to only managed classes (where teacher is class teacher)
  for_student_form?: boolean;
  for_subject_form?: boolean;
}

/**
 * Get the appropriate base URL based on user role and operation type
 */
function getBaseUrl(userRole?: string | null, isWriteOperation = false): string {
  // Write operations always use admin endpoint
  if (isWriteOperation) {
    return ADMIN_BASE_URL;
  }
  
  // Read operations: use employee endpoint for non-admins, admin endpoint for admins
  return isAdminRole(userRole) ? ADMIN_BASE_URL : EMPLOYEE_BASE_URL;
}

export async function getClasses(
  params?: ClassQueryParams,
  userRole?: string | null
): Promise<ClassListResponse> {
  const baseUrl = getBaseUrl(userRole, false);
  const response = await apiClient.get<ClassListResponse>(baseUrl, { params });
  return response.data;
}

export async function getClassById(
  publicId: string,
  isDeleted?: boolean,
  userRole?: string | null
): Promise<ClassDetailResponse> {
  const baseUrl = isDeleted ? ADMIN_BASE_URL : getBaseUrl(userRole, false);
  const response = await apiClient.get<ClassDetailResponse>(
    `${baseUrl}${publicId}/`,
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createClass(
  data: Partial<Class>,
  forceCreate?: boolean
): Promise<ClassDetailResponse> {
  // Always use admin endpoint for create
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<ClassDetailResponse>(ADMIN_BASE_URL, data, {
    params,
  });
  return response.data;
}

export async function updateClass(publicId: string, data: Partial<Class>): Promise<void> {
  // Always use admin endpoint for update
  await apiClient.patch(`${ADMIN_BASE_URL}${publicId}/`, data);
}

export async function deleteClass(publicId: string): Promise<void> {
  // Always use admin endpoint for delete
  try {
    await apiClient.delete(`${ADMIN_BASE_URL}${publicId}/`);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

export async function restoreClass(publicId: string): Promise<ClassDetailResponse> {
  // Always use admin endpoint for restore
  const response = await apiClient.post<ClassDetailResponse>(
    `${ADMIN_BASE_URL}${publicId}/activate/`
  );
  return response.data;
}
