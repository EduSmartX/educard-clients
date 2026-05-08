/**
 * Teachers Feature — API Layer
 * All API calls for teacher CRUD operations
 *
 * Permission Model:
 * - Admin: Full CRUD access via /teacher/admin/ endpoints
 * - Teacher: Read-only access via /teacher/employee/ endpoints (masked phone numbers)
 */

import type {
  Teacher,
  TeacherDetail,
  CreateTeacherPayload,
  ApiListResponse,
  ApiDetailResponse,
} from '@educard/shared';

import { apiClient } from '@/api/client';
// API_ENDPOINTS unused - keeping for future reference
// import { API_ENDPOINTS } from '@/constants';
import { isAdminRole } from '@/utils/role-utils';

// Admin endpoints - Full CRUD operations
const ADMIN_BASE_URL = '/teacher/admin/';
// Employee endpoints - Read-only access (phone numbers masked)
const EMPLOYEE_BASE_URL = '/teacher/employee/';

export type TeacherListResponse = ApiListResponse<Teacher>;

export interface TeacherQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_deleted?: boolean;
  gender?: string;
  designation?: string;
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

export async function getTeachers(
  params?: TeacherQueryParams,
  userRole?: string | null
): Promise<TeacherListResponse> {
  // Deleted view requires admin endpoint (employee endpoint ignores is_deleted)
  const baseUrl = params?.is_deleted ? ADMIN_BASE_URL : getBaseUrl(userRole, false);
  const response = await apiClient.get<TeacherListResponse>(baseUrl, {
    params,
  });
  return response.data;
}

export async function getTeacherById(
  publicId: string,
  isDeleted?: boolean,
  userRole?: string | null
): Promise<ApiDetailResponse<TeacherDetail>> {
  // Deleted view requires admin endpoint
  const baseUrl = isDeleted ? ADMIN_BASE_URL : getBaseUrl(userRole, false);
  const response = await apiClient.get<ApiDetailResponse<TeacherDetail>>(
    `${baseUrl}${publicId}/`,
    isDeleted ? { params: { is_deleted: true } } : undefined
  );
  return response.data;
}

export async function createTeacher(
  data: CreateTeacherPayload,
  forceCreate?: boolean
): Promise<ApiDetailResponse<TeacherDetail>> {
  // Always use admin endpoint for create
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<ApiDetailResponse<TeacherDetail>>(ADMIN_BASE_URL, data, {
    params,
  });
  return response.data;
}

export async function updateTeacher(
  publicId: string,
  data: Partial<CreateTeacherPayload>
): Promise<ApiDetailResponse<TeacherDetail>> {
  // Always use admin endpoint for update
  const response = await apiClient.patch<ApiDetailResponse<TeacherDetail>>(
    `${ADMIN_BASE_URL}${publicId}/`,
    data
  );
  return response.data;
}

export async function deleteTeacher(publicId: string): Promise<void> {
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

export async function restoreTeacher(publicId: string): Promise<ApiDetailResponse<Teacher>> {
  // Always use admin endpoint for restore
  const response = await apiClient.post<ApiDetailResponse<Teacher>>(
    `${ADMIN_BASE_URL}${publicId}/activate/`
  );
  return response.data;
}
