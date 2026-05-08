/**
 * Holiday Calendar API Functions
 * Handles all API calls for organization holiday calendar
 * Automatically routes to admin or public endpoints based on operation type
 */

import api from '../../../lib/api';
import type {
  CreateHolidayPayload,
  FetchHolidaysParams,
  HolidayListResponse,
  HolidayResponse,
  UpdateHolidayPayload,
  WorkingDayPolicyListResponse,
  BulkUploadResult,
} from '../types';

// ============================================================================
// API Endpoints
// ============================================================================

// Public endpoints - accessible to all authenticated users (read-only)
const PUBLIC_ENDPOINTS = {
  holidays: '/attendance/holiday-calendar/',
  holidayDetail: (id: string) => `/attendance/holiday-calendar/${id}/`,
  workingDayPolicy: '/attendance/working-day-policy/',
};

// Admin endpoints - full CRUD access
const ADMIN_ENDPOINTS = {
  holidays: '/attendance/admin/holiday-calendar/',
  holidayDetail: (id: string) => `/attendance/admin/holiday-calendar/${id}/`,
  holidayTemplate: '/attendance/admin/holiday-calendar/download-template/',
  holidayBulkUpload: '/attendance/admin/holiday-calendar/bulk-upload/',
  workingDayPolicy: '/attendance/admin/working-day-policy/',
};

/**
 * Get the appropriate endpoint based on operation type
 * Read operations use public endpoints, write operations use admin endpoints
 */
function getHolidaysEndpoint(isWriteOperation: boolean = false): string {
  return isWriteOperation ? ADMIN_ENDPOINTS.holidays : PUBLIC_ENDPOINTS.holidays;
}

function getHolidayDetailEndpoint(id: string, isWriteOperation: boolean = false): string {
  return isWriteOperation ? ADMIN_ENDPOINTS.holidayDetail(id) : PUBLIC_ENDPOINTS.holidayDetail(id);
}

function getWorkingDayPolicyEndpoint(): string {
  // Always use public endpoint for reading
  return PUBLIC_ENDPOINTS.workingDayPolicy;
}

// ============================================================================
// Holiday CRUD Operations
// ============================================================================

/**
 * Fetch holidays with optional filters
 * Uses public endpoint accessible to all authenticated users
 */
export async function fetchHolidays(params?: FetchHolidaysParams): Promise<HolidayListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.from_date) {
    queryParams.append('from_date', params.from_date);
  }
  if (params?.to_date) {
    queryParams.append('to_date', params.to_date);
  }
  if (params?.holiday_type) {
    queryParams.append('holiday_type', params.holiday_type);
  }
  if (params?.ordering) {
    queryParams.append('ordering', params.ordering);
  }
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append('page_size', params.page_size.toString());
  }

  const endpoint = getHolidaysEndpoint(false); // Read operation uses public endpoint
  const url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const response = await api.get<HolidayListResponse>(url);
  return response.data;
}

/**
 * Fetch a single holiday by ID
 * Uses public endpoint for read operations
 */
export async function fetchHoliday(id: string): Promise<HolidayResponse> {
  const endpoint = getHolidayDetailEndpoint(id, false); // Read operation uses public endpoint
  const response = await api.get<HolidayResponse>(endpoint);
  return response.data;
}

/**
 * Create a new holiday (Admin only)
 * Uses admin endpoint for write operations
 */
export async function createHoliday(payload: CreateHolidayPayload): Promise<HolidayResponse> {
  const endpoint = getHolidaysEndpoint(true); // Write operation uses admin endpoint
  const response = await api.post<HolidayResponse>(endpoint, payload);
  return response.data;
}

/**
 * Create multiple holidays at once (Admin only)
 * Uses admin endpoint for write operations
 */
export async function createHolidaysBulk(
  payloads: CreateHolidayPayload[]
): Promise<HolidayResponse> {
  const endpoint = getHolidaysEndpoint(true); // Write operation uses admin endpoint
  const response = await api.post<HolidayResponse>(endpoint, payloads);
  return response.data;
}

/**
 * Update an existing holiday (Admin only)
 * Uses admin endpoint for write operations
 */
export async function updateHoliday(
  id: string,
  payload: Partial<UpdateHolidayPayload>
): Promise<HolidayResponse> {
  const endpoint = getHolidayDetailEndpoint(id, true); // Write operation uses admin endpoint
  const response = await api.patch<HolidayResponse>(endpoint, payload);
  return response.data;
}

/**
 * Delete a holiday (Admin only)
 * Uses admin endpoint for write operations
 */
export async function deleteHoliday(id: string): Promise<void> {
  const endpoint = getHolidayDetailEndpoint(id, true); // Write operation uses admin endpoint
  await api.delete(endpoint);
}

// ============================================================================
// Bulk Operations (Admin only)
// ============================================================================

/**
 * Download holiday template Excel file (Admin only)
 */
export async function downloadHolidayTemplate(): Promise<Blob> {
  const response = await api.get(ADMIN_ENDPOINTS.holidayTemplate, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Upload bulk holidays from Excel file (Admin only)
 */
export async function bulkUploadHolidays(
  file: File
): Promise<{ success: boolean; message: string; data: BulkUploadResult; code: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{
    success: boolean;
    message: string;
    data: BulkUploadResult;
    code: number;
  }>(ADMIN_ENDPOINTS.holidayBulkUpload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

// ============================================================================
// Working Day Policy
// ============================================================================

/**
 * Fetch working day policy
 * Uses role-appropriate endpoint
 */
export async function fetchWorkingDayPolicy(): Promise<WorkingDayPolicyListResponse> {
  const endpoint = getWorkingDayPolicyEndpoint();
  const response = await api.get<WorkingDayPolicyListResponse>(endpoint);
  return response.data;
}
