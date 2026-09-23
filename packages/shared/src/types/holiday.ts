/**
 * Holiday Types — Shared between Web and Mobile
 * Matches backend API responses
 * 
 * NOTE: HolidayType and SaturdayOffPattern enums are defined in constants/attendance.ts
 * This file contains interface definitions that use those types.
 */

import type { SaturdayOffPatternType } from '../constants/attendance';

// =============================================================================
// Holiday Interfaces
// =============================================================================

// Re-export the holiday type for convenience
export type { HolidayTypeValue as HolidayTypeEnum, SaturdayOffPatternType } from '../constants/attendance';

export const HOLIDAY_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  SUNDAY: { bg: '#fee2e2', text: '#dc2626' },
  SATURDAY: { bg: '#fef3c7', text: '#d97706' },
  SECOND_SATURDAY: { bg: '#fef3c7', text: '#d97706' },
  NATIONAL_HOLIDAY: { bg: '#dbeafe', text: '#2563eb' },
  STATE_HOLIDAY: { bg: '#dbeafe', text: '#2563eb' },
  FESTIVAL: { bg: '#fce7f3', text: '#db2777' },
  ORGANIZATION_HOLIDAY: { bg: '#dcfce7', text: '#16a34a' },
  OTHER: { bg: '#f3f4f6', text: '#6b7280' },
};

export interface Holiday {
  public_id: string;
  start_date: string;
  end_date: string;
  holiday_type: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayListParams {
  from_date?: string;
  to_date?: string;
  holiday_type?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface HolidayCreatePayload {
  start_date: string;
  end_date?: string;
  holiday_type: string;
  description: string;
}

export interface HolidayUpdatePayload {
  start_date?: string;
  end_date?: string;
  holiday_type?: string;
  description?: string;
}

// =============================================================================
// Working Day Policy Interfaces
// =============================================================================

export interface WorkingDayPolicy {
  public_id: string;
  sunday_off: boolean;
  saturday_off_pattern: SaturdayOffPatternType;
  effective_from: string;
  effective_to: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkingDayPolicyCreatePayload {
  sunday_off: boolean;
  saturday_off_pattern: SaturdayOffPatternType;
  effective_from: string;
  effective_to?: string | null;
}

export interface WorkingDayPolicyUpdatePayload {
  sunday_off?: boolean;
  saturday_off_pattern?: SaturdayOffPatternType;
  effective_from?: string;
  effective_to?: string | null;
}
