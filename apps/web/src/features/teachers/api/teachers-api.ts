/**
 * Teacher API
 * All API calls for teacher CRUD operations
 */

import api from '@/lib/api';
import { isAdminUser } from '@/lib/utils/auth-utils';
import type {
  Teacher,
  TeacherDetail,
  CreateTeacherPayload,
  UpdateTeacherPayload,
  FetchTeachersParams,
  TeachersResponse,
  TeacherBulkUploadResponse,
  PaginatedResponse,
  ApiResponse,
} from '../types';

// Admin endpoints - Full CRUD operations
const ADMIN_BASE_URL = '/teacher/admin/';

// Employee endpoints - Read-only access
const EMPLOYEE_BASE_URL = '/teacher/employee/';

/**
 * Get the appropriate base URL based on user role and operation type
 */
function getBaseUrl(isWriteOperation = false): string {
  // Write operations always use admin endpoint
  if (isWriteOperation) {
    return ADMIN_BASE_URL;
  }

  // Read operations: use employee endpoint for non-admins, admin endpoint for admins
  return isAdminUser() ? ADMIN_BASE_URL : EMPLOYEE_BASE_URL;
}

/**
 * Fetch all teachers with pagination and filters
 */
export async function fetchTeachers(
  params: FetchTeachersParams = {}
): Promise<PaginatedResponse<Teacher>> {
  // Deleted view requires admin endpoint (employee endpoint ignores is_deleted)
  const baseUrl = params.is_deleted ? ADMIN_BASE_URL : getBaseUrl(false);
  const response = await api.get<TeachersResponse>(baseUrl, { params });
  return {
    data: response.data.data,
    pagination: response.data.pagination!,
  };
}

/**
 * Fetch a single teacher by ID
 */
export async function fetchTeacher(publicId: string, isDeleted?: boolean): Promise<TeacherDetail> {
  // Deleted teacher detail requires admin endpoint
  const baseUrl = isDeleted ? ADMIN_BASE_URL : getBaseUrl(false);
  const params = isDeleted ? { is_deleted: 'true' } : {};

  try {
    const response = await api.get<ApiResponse<TeacherDetail>>(`${baseUrl}${publicId}/`, {
      params,
    });

    // Ensure we return valid data or throw an error
    if (!response?.data?.data) {
      throw new Error('Teacher data not found');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error fetching teacher:', error);
    throw error;
  }
}

/**
 * Create a new teacher
 */
export async function createTeacher(
  data: CreateTeacherPayload,
  forceCreate?: boolean
): Promise<TeacherDetail> {
  const baseUrl = getBaseUrl(true); // Write operation
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await api.post<ApiResponse<TeacherDetail>>(baseUrl, data, { params });
  return response.data.data;
}

/**
 * Update an existing teacher
 */
export async function updateTeacher(
  publicId: string,
  data: UpdateTeacherPayload
): Promise<TeacherDetail> {
  const baseUrl = getBaseUrl(true); // Write operation
  const response = await api.put<ApiResponse<TeacherDetail>>(`${baseUrl}${publicId}/`, data);
  return response.data.data;
}

/**
 * Delete a teacher (soft delete)
 */
export async function deleteTeacher(publicId: string): Promise<void> {
  const baseUrl = getBaseUrl(true); // Write operation
  await api.delete(`${baseUrl}${publicId}/`);
}

/**
 * Bulk upload teachers from Excel file
 */
export async function bulkUploadTeachers(file: File): Promise<TeacherBulkUploadResponse['data']> {
  const baseUrl = getBaseUrl(true); // Write operation
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<TeacherBulkUploadResponse>(`${baseUrl}bulk-upload/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
}

/**
 * Download teacher bulk import template
 */
export async function downloadTeacherTemplate(): Promise<Blob> {
  const baseUrl = getBaseUrl(true); // Write operation (admin only)
  const response = await api.get(`${baseUrl}download-template/`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Activate a deactivated teacher
 */
export async function reactivateTeacher(publicId: string): Promise<Teacher> {
  const baseUrl = getBaseUrl(true); // Write operation
  const response = await api.post<ApiResponse<Teacher>>(`${baseUrl}${publicId}/activate/`);
  return response.data.data;
}

/**
 * Validate email verification token and get user details
 */
export async function validateVerificationToken(token: string): Promise<{
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}> {
  const response = await api.get<
    ApiResponse<{
      email: string;
      username: string;
      first_name: string;
      last_name: string;
    }>
  >(`/teacher/verify-email/`, {
    params: { token },
  });
  return response.data.data;
}

/**
 * Verify email and set password for new teacher
 */
export async function verifyEmailAndSetPassword(data: {
  token: string;
  password: string;
  confirm_password: string;
}): Promise<{
  username: string;
  email: string;
}> {
  const response = await api.post<
    ApiResponse<{
      username: string;
      email: string;
    }>
  >(`/teacher/verify-email/`, data);
  return response.data.data;
}
