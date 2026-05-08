/**
 * Classes API
 * All API calls for class CRUD operations
 */

import api from '@/lib/api';
import { isAdminUser } from '@/lib/utils/auth-utils';
import type {
  Class,
  CreateClassPayload,
  UpdateClassPayload,
  FetchClassesParams,
  ClassesResponse,
  ClassResponse,
  ClassBulkUploadResponse,
  PaginatedResponse,
} from '../types';

// Admin endpoints - Full CRUD operations
const ADMIN_BASE_URL = '/classes/admin/';

// Employee endpoints - Read-only access
const EMPLOYEE_BASE_URL = '/classes/employee/';

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

export async function fetchClasses(
  params: FetchClassesParams = {}
): Promise<PaginatedResponse<Class>> {
  const baseUrl = getBaseUrl(false); // Read operation
  
  // Add is_deleted=false by default if not explicitly provided
  const queryParams = {
    is_deleted: false,
    ...params,
  };

  const response = await api.get<ClassesResponse>(baseUrl, { params: queryParams });

  // Transform the response to match our PaginatedResponse structure
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

export async function fetchClass(publicId: string, isDeleted = false): Promise<Class> {
  const baseUrl = getBaseUrl(false); // Read operation
  const params = isDeleted ? { is_deleted: 'true' } : {};
  const response = await api.get<ClassResponse>(`${baseUrl}${publicId}/`, { params });
  
  // Ensure we return valid data or throw an error
  if (!response.data.data) {
    throw new Error('Class data not found');
  }
  
  return response.data.data;
}

export async function createClass(data: CreateClassPayload, forceCreate?: boolean): Promise<Class> {
  const baseUrl = getBaseUrl(true); // Write operation
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await api.post<ClassResponse>(baseUrl, data, { params });
  return response.data.data;
}

export async function updateClass(publicId: string, data: UpdateClassPayload): Promise<Class> {
  const baseUrl = getBaseUrl(true); // Write operation
  const response = await api.put<ClassResponse>(`${baseUrl}${publicId}/`, data);
  return response.data.data;
}

export async function deleteClass(publicId: string): Promise<void> {
  const baseUrl = getBaseUrl(true); // Write operation
  await api.delete(`${baseUrl}${publicId}/`);
}

export async function reactivateClass(publicId: string): Promise<Class> {
  const baseUrl = getBaseUrl(true); // Write operation
  const response = await api.post<ClassResponse>(`${baseUrl}${publicId}/activate/`);
  return response.data.data;
}

export async function bulkUploadClasses(file: File): Promise<ClassBulkUploadResponse['data']> {
  const baseUrl = getBaseUrl(true); // Write operation
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ClassBulkUploadResponse>(`${baseUrl}bulk-upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}
