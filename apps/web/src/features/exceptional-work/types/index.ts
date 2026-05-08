/**
 * TypeScript types for Exceptional Work Policy feature
 */

export type OverrideType = 'FORCE_WORKING' | 'FORCE_HOLIDAY';

export interface CalendarException {
  public_id: string;
  organization?: string;
  date: string; // ISO date string
  override_type: OverrideType;
  reason: string;
  is_applicable_to_all_classes: boolean;
  is_applicable_to_all_teachers: boolean;
  classes: string[]; // Array of class public_ids
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_public_id?: string;
  created_by_name?: string;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

export interface CalendarExceptionCreate {
  date: string; // ISO date string
  override_type: OverrideType;
  reason: string;
  is_applicable_to_all_classes: boolean;
  is_applicable_to_all_teachers?: boolean;
  classes?: string[]; // Optional, only if not applicable to all
}

export interface CalendarExceptionUpdate {
  date?: string;
  override_type?: OverrideType;
  reason?: string;
  is_applicable_to_all_classes?: boolean;
  is_applicable_to_all_teachers?: boolean;
  classes?: string[];
}

export interface CalendarExceptionFilters {
  override_type?: OverrideType;
  from_date?: string;
  to_date?: string;
  classes?: string[]; // Array of class IDs for filtering
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface CalendarExceptionListResponse {
  success: boolean;
  message: string;
  data: CalendarException[];
  pagination: {
    current_page: number;
    total_pages: number;
    count: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };
  code: number;
}
