/**
 * API functions for Exceptional Work Policy (Calendar Exceptions)
 * Uses public endpoints for read operations (all users) and admin endpoints for write operations (admin only)
 */

import api from '@/lib/api';
import type {
  CalendarException,
  CalendarExceptionCreate,
  CalendarExceptionFilters,
  CalendarExceptionListResponse,
  CalendarExceptionUpdate,
} from '../types';

// Public endpoints - Read-only access for all authenticated users
const PUBLIC_ENDPOINTS = {
  exceptions: '/attendance/calendar-exception/',
  exceptionDetail: (id: string) => `/attendance/calendar-exception/${id}/`,
};

// Admin endpoints - Full CRUD access for admins
const ADMIN_ENDPOINTS = {
  exceptions: '/attendance/admin/calendar-exception/',
  exceptionDetail: (id: string) => `/attendance/admin/calendar-exception/${id}/`,
};

/**
 * Get the appropriate calendar exceptions endpoint based on operation type
 * @param isWriteOperation - If true, uses admin endpoint. If false, uses public endpoint.
 */
function getExceptionsEndpoint(isWriteOperation = false): string {
  return isWriteOperation ? ADMIN_ENDPOINTS.exceptions : PUBLIC_ENDPOINTS.exceptions;
}

/**
 * Get the appropriate calendar exception detail endpoint based on operation type
 * @param id - The calendar exception public_id
 * @param isWriteOperation - If true, uses admin endpoint. If false, uses public endpoint.
 */
function getExceptionDetailEndpoint(id: string, isWriteOperation = false): string {
  return isWriteOperation ? ADMIN_ENDPOINTS.exceptionDetail(id) : PUBLIC_ENDPOINTS.exceptionDetail(id);
}

/**
 * Fetch paginated list of calendar exceptions with optional filters
 * Uses public endpoint accessible to all authenticated users
 */
export async function fetchCalendarExceptions(
  filters?: CalendarExceptionFilters
): Promise<CalendarExceptionListResponse> {
  const params = new URLSearchParams();

  if (filters?.override_type) {
    params.append('override_type', filters.override_type);
  }
  if (filters?.from_date) {
    params.append('from_date', filters.from_date);
  }
  if (filters?.to_date) {
    params.append('to_date', filters.to_date);
  }
  if (filters?.classes && filters.classes.length > 0) {
    // Backend expects comma-separated class IDs
    params.append('classes', filters.classes.join(','));
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.page_size) {
    params.append('page_size', filters.page_size.toString());
  }
  if (filters?.ordering) {
    params.append('ordering', filters.ordering);
  }

  const endpoint = getExceptionsEndpoint(false); // Read operation
  const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await api.get<CalendarExceptionListResponse>(url);
  return response.data;
}

/**
 * Fetch a single calendar exception by public_id
 * Uses public endpoint for reading
 */
export async function fetchCalendarException(publicId: string): Promise<CalendarException> {
  const endpoint = getExceptionDetailEndpoint(publicId, false); // Read operation
  const response = await api.get<{ data: CalendarException }>(endpoint);
  return response.data.data;
}

/**
 * Create a new calendar exception (Admin only)
 * Uses admin endpoint for writing
 */
export async function createCalendarException(
  data: CalendarExceptionCreate
): Promise<CalendarException> {
  const endpoint = getExceptionsEndpoint(true); // Write operation
  const response = await api.post<{ data: CalendarException }>(endpoint, data);
  return response.data.data;
}

/**
 * Update an existing calendar exception (Admin only)
 * Uses admin endpoint for writing
 */
export async function updateCalendarException(
  publicId: string,
  data: CalendarExceptionUpdate
): Promise<CalendarException> {
  const endpoint = getExceptionDetailEndpoint(publicId, true); // Write operation
  const response = await api.patch<{ data: CalendarException }>(endpoint, data);
  return response.data.data;
}

/**
 * Delete a calendar exception (Admin only)
 * Uses admin endpoint for deletion
 */
export async function deleteCalendarException(publicId: string): Promise<void> {
  const endpoint = getExceptionDetailEndpoint(publicId, true); // Write operation
  await api.delete(endpoint);
}
