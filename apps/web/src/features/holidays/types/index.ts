/**
 * Holiday Calendar Types
 * Re-exports from @educard/shared + web-specific types
 */

import type { ApiListResponse, ApiDetailResponse } from '../../../lib/utils/api-response-handler';
import type {
  Holiday as SharedHoliday,
  HolidayListParams,
  HolidayCreatePayload,
  HolidayUpdatePayload as SharedHolidayUpdatePayload,
  WorkingDayPolicy as SharedWorkingDayPolicy,
} from '@educard/shared';

// Re-export shared types
export type {
  HolidayListParams,
  HolidayCreatePayload,
  WorkingDayPolicyCreatePayload,
  WorkingDayPolicyUpdatePayload,
  SaturdayOffPatternType,
} from '@educard/shared';

export type { HolidayTypeValue } from '@educard/shared';
export {
  HOLIDAY_TYPE_COLORS,
  HolidayType,
  HolidayTypeLabels,
  SaturdayOffPattern,
  SaturdayOffPatternLabels,
} from '@educard/shared';

// Re-export with original names for backward compatibility
export type Holiday = SharedHoliday;
export type WorkingDayPolicy = SharedWorkingDayPolicy;

// Backward-compatible type aliases
export type CreateHolidayPayload = HolidayCreatePayload;
export type UpdateHolidayPayload = SharedHolidayUpdatePayload & { public_id: string };
export type FetchHolidaysParams = HolidayListParams;

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
