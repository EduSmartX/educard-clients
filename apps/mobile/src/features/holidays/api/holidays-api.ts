/**
 * Holiday Calendar — API Layer
 *
 * Types are now imported from @educard/shared for consistency
 */

import {
  createHolidaysApi,
  HolidayType,
  HolidayTypeLabels,
  type Holiday,
  type HolidayListParams,
  type HolidayCreatePayload,
  type HolidayUpdatePayload,
  type WorkingDayPolicy,
  type WorkingDayPolicyCreatePayload,
  type HolidayTypeValue,
  type SaturdayOffPatternType,
} from '@educard/shared';

import { apiClient } from '@/api/client';

// Re-export types for external use with backward-compatible names
export type { Holiday, WorkingDayPolicy, HolidayTypeValue };
export type FetchHolidaysParams = HolidayListParams;
export type CreateHolidayPayload = HolidayCreatePayload;
export type UpdateHolidayPayload = HolidayUpdatePayload;
export type SaturdayOffPattern = SaturdayOffPatternType;

// Re-export constants
export { HolidayType, HolidayTypeLabels };

// Note: We use manual API functions below instead of shared factory
// because this module exports additional response wrapper types
const _holidaysApi = createHolidaysApi({ client: apiClient });

interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface ApiDetailResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================================================
// Holidays API
// ============================================================================

export async function getHolidays(params?: FetchHolidaysParams): Promise<ApiListResponse<Holiday>> {
  const queryParams = new URLSearchParams();
  if (params?.from_date) queryParams.append('from_date', params.from_date);
  if (params?.to_date) queryParams.append('to_date', params.to_date);
  if (params?.holiday_type) queryParams.append('holiday_type', params.holiday_type);
  if (params?.ordering) queryParams.append('ordering', params.ordering);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

  const url = `/attendance/holiday-calendar/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient.get<ApiListResponse<Holiday>>(url);
  return response.data;
}

export async function getHolidayById(id: string): Promise<ApiDetailResponse<Holiday>> {
  const response = await apiClient.get<ApiDetailResponse<Holiday>>(
    `/attendance/holiday-calendar/${id}/`
  );
  return response.data;
}

export async function createHoliday(
  data: CreateHolidayPayload
): Promise<ApiDetailResponse<Holiday>> {
  const response = await apiClient.post<ApiDetailResponse<Holiday>>(
    '/attendance/admin/holiday-calendar/',
    data
  );
  return response.data;
}

export async function updateHoliday(
  id: string,
  data: Partial<CreateHolidayPayload>
): Promise<ApiDetailResponse<Holiday>> {
  const response = await apiClient.patch<ApiDetailResponse<Holiday>>(
    `/attendance/admin/holiday-calendar/${id}/`,
    data
  );
  return response.data;
}

export async function deleteHoliday(id: string): Promise<void> {
  try {
    await apiClient.delete(`/attendance/admin/holiday-calendar/${id}/`);
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

// ============================================================================
// Working Day Policy API
// ============================================================================

export async function getWorkingDayPolicy(): Promise<ApiListResponse<WorkingDayPolicy>> {
  const response = await apiClient.get<ApiListResponse<WorkingDayPolicy>>(
    '/attendance/working-day-policy/'
  );
  return response.data;
}

// Type re-exported from shared above
export type CreateWorkingDayPolicyPayload = WorkingDayPolicyCreatePayload;

export async function createWorkingDayPolicy(
  data: CreateWorkingDayPolicyPayload
): Promise<ApiDetailResponse<WorkingDayPolicy>> {
  const response = await apiClient.post<ApiDetailResponse<WorkingDayPolicy>>(
    '/attendance/admin/working-day-policy/',
    data
  );
  return response.data;
}

export async function updateWorkingDayPolicy(
  id: string,
  data: Partial<CreateWorkingDayPolicyPayload>
): Promise<ApiDetailResponse<WorkingDayPolicy>> {
  const response = await apiClient.patch<ApiDetailResponse<WorkingDayPolicy>>(
    `/attendance/admin/working-day-policy/${id}/`,
    data
  );
  return response.data;
}

// ============================================================================
// Bulk Upload API
// ============================================================================

/**
 * Download holiday bulk import template
 */
export async function downloadHolidayTemplate(): Promise<ArrayBuffer> {
  const response = await apiClient.get<ArrayBuffer>(
    '/attendance/admin/holiday-calendar/download-template/',
    {
      responseType: 'arraybuffer',
    }
  );
  return response.data;
}

/**
 * Bulk upload holidays from Excel file
 */
export async function bulkUploadHolidays(
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
  }>('/attendance/admin/holiday-calendar/bulk-upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
