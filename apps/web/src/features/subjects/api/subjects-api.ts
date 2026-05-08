/**
 * Subjects API Client
 */

import apiClient from '@/lib/api';
import type { ApiListResponse } from '@/lib/utils/api-response-handler';
import type {
  Subject,
  SubjectListParams,
  SubjectCreatePayload,
  SubjectUpdatePayload,
  SubjectBulkUploadPayload,
} from '../types/subject';

// Base URL for subjects API (all users use same endpoint, backend handles permissions)
const BASE_URL = '/subjects';

/**
 * Fetch list of subjects
 */
export async function fetchSubjects(params?: SubjectListParams): Promise<ApiListResponse<Subject>> {
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.class_assigned) {
    queryParams.append('class_assigned', params.class_assigned);
  }
  if (params?.subject_master) {
    queryParams.append('subject_master', params.subject_master.toString());
  }
  if (params?.teacher) {
    queryParams.append('teacher', params.teacher);
  }
  if (params?.is_deleted !== undefined) {
    queryParams.append('is_deleted', params.is_deleted.toString());
  }

  const url = queryParams.toString() ? `${BASE_URL}/?${queryParams}` : `${BASE_URL}/`;
  const response = await apiClient.get<ApiListResponse<Subject>>(url);
  
  // Backend handles can_manage field, default to true for UI
  if (response.data.data) {
    response.data.data = response.data.data.map((subject) => ({
      ...subject,
      can_manage: subject.can_manage ?? true,
    }));
  }
  
  return response.data;
}

/**
 * Fetch single subject by public_id
 */
export async function fetchSubject(publicId: string, isDeleted = false): Promise<Subject> {
  const params = isDeleted ? { is_deleted: 'true' } : {};
  const response = await apiClient.get<{ success: boolean; data: Subject }>(
    `${BASE_URL}/${publicId}/`,
    { params }
  );
  return response.data.data;
}

/**
 * Create a new subject
 */
export async function createSubject(
  data: SubjectCreatePayload,
  forceCreate = false
): Promise<Subject> {
  const params = forceCreate ? { force_create: 'true' } : {};
  const response = await apiClient.post<{ success: boolean; data: Subject }>(`${BASE_URL}/`, data, {
    params,
  });
  return response.data.data;
}

/**
 * Update an existing subject
 */
export async function updateSubject(
  publicId: string,
  data: SubjectUpdatePayload
): Promise<Subject> {
  const response = await apiClient.patch<{ success: boolean; data: Subject }>(
    `${BASE_URL}/${publicId}/`,
    data
  );
  return response.data.data;
}

/**
 * Delete a subject (soft delete)
 */
export async function deleteSubject(publicId: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${publicId}/`);
}

/**
 * Reactivate a deleted subject
 */
export async function reactivateSubject(publicId: string): Promise<Subject> {
  const response = await apiClient.post<{ success: boolean; data: Subject }>(
    `${BASE_URL}/${publicId}/activate/`
  );
  return response.data.data;
}

/**
 * Bulk upload subjects
 */
export async function bulkUploadSubjects(data: SubjectBulkUploadPayload): Promise<{
  success: boolean;
  message: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: Array<{ row: number; errors: Record<string, string[]> }>;
}> {
  const formData = new FormData();
  formData.append('file', data.file);

  const response = await apiClient.post(`${BASE_URL}/bulk-upload/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Download subject template
 */
export async function downloadSubjectTemplate(): Promise<Blob> {
  const response = await apiClient.get(`${BASE_URL}/download-template/`, {
    responseType: 'blob',
  });
  return response.data;
}
