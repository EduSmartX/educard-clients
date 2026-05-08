/**
 * Holiday Calendar Types
 * TypeScript interfaces for holiday calendar feature
 */

import type { ApiListResponse, ApiDetailResponse } from '../../../lib/utils/api-response-handler';

/**
 * Holiday types supported by the system
 */
export type HolidayType =
  | 'SUNDAY'
  | 'SATURDAY'
  | 'SECOND_SATURDAY'
  | 'NATIONAL_HOLIDAY'
  | 'FESTIVAL'
  | 'ORGANIZATION_HOLIDAY'
  | 'OTHER';

/**
 * Holiday entity from backend
 */
export interface Holiday {
  public_id: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  holiday_type: HolidayType;
  description: string;
  created_at?: string;
  updated_at?: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

/**
 * Create holiday payload (for POST request)
 */
export interface CreateHolidayPayload {
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD (optional, defaults to start_date)
  holiday_type: Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>; // Cannot manually create weekends
  description: string;
}

/**
 * Update holiday payload (for PUT/PATCH request)
 */
export interface UpdateHolidayPayload extends CreateHolidayPayload {
  public_id: string;
}

/**
 * Fetch holidays query parameters
 */
export interface FetchHolidaysParams {
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  holiday_type?: HolidayType;
  ordering?: string; // e.g., 'start_date', '-start_date'
  page?: number;
  page_size?: number;
}

/**
 * API response for holiday list
 */
export type HolidayListResponse = ApiListResponse<Holiday>;

/**
 * API response for single holiday
 */
export type HolidayResponse = ApiDetailResponse<Holiday>;

/**
 * Bulk upload result
 */
export interface BulkUploadResult {
  success: boolean;
  created_count: number;
  failed_count: number;
  total_rows: number;
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

/**
 * Saturday off pattern for working day policy
 */
export type SaturdayOffPattern = 'NONE' | 'SECOND_ONLY' | 'SECOND_AND_FOURTH' | 'ALL';

/**
 * Working day policy entity
 */
export interface WorkingDayPolicy {
  public_id: string;
  sunday_off: boolean;
  saturday_off_pattern: SaturdayOffPattern;
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null; // YYYY-MM-DD or null
  created_at?: string;
  updated_at?: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

/**
 * API response for working day policy list
 */
export type WorkingDayPolicyListResponse = ApiListResponse<WorkingDayPolicy>;

/**
 * Holiday form data (for internal form state)
 */
export interface HolidayFormData extends CreateHolidayPayload {
  id: string; // Internal ID for form management
  isExpanded?: boolean;
}

/**
 * Holiday colors for UI
 */
export interface HolidayColors {
  bg: string;
  text: string;
  badge: string;
  border: string;
}

/**
 * Calendar day data
 */
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  holidays: Holiday[];
}

/**
 * View mode for holiday calendar
 */
export type ViewMode = 'calendar' | 'table' | 'bulk-upload';
