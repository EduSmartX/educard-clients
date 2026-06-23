/**
 * Shared API utilities for mobile features
 * Eliminates duplicate patterns across teachers-api, subjects-api, classes-api, etc.
 */

import type { ApiMessageResponse } from '@educard/shared';

import { apiClient } from '@/api/client';
import { isAdminRole } from '@/utils/role-utils';

/**
 * Creates a role-based URL resolver for features with admin/employee endpoints
 */
export function createRoleBasedUrlResolver(adminUrl: string, employeeUrl: string) {
  return function getBaseUrl(userRole?: string | null, isWriteOperation = false): string {
    if (isWriteOperation) return adminUrl;
    return isAdminRole(userRole) ? adminUrl : employeeUrl;
  };
}

/**
 * Safe delete with 204/Network Error handling
 * Many endpoints return 204 No Content which causes parsing issues on mobile
 */
export async function safeDelete(url: string, successMessage: string): Promise<ApiMessageResponse> {
  try {
    const response = await apiClient.delete<ApiMessageResponse>(url);
    return response.data || { success: true, message: successMessage };
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return { success: true, message: successMessage };
    if (axiosError?.message === 'Network Error' && !axiosError?.response)
      return { success: true, message: successMessage };
    throw error;
  }
}

/**
 * Safe delete that returns void (for endpoints that don't return a body)
 */
export async function safeDeleteVoid(url: string): Promise<void> {
  try {
    await apiClient.delete(url);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

/**
 * Bulk upload response type shared across features
 */
export interface BulkUploadResponse {
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
}

/**
 * Generic bulk upload function for Excel files
 */
export async function bulkUploadExcel(
  url: string,
  fileUri: string,
  fileName: string,
  extraParams?: Record<string, string>
): Promise<BulkUploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  } as unknown as Blob);

  const response = await apiClient.post<BulkUploadResponse>(url, formData, {
    params: extraParams,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
