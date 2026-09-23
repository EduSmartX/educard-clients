/**
 * Calendar / Working Day Types
 * Shared across web and mobile for working day navigation
 */

export interface WorkingDayInfo {
  date: string; // YYYY-MM-DD format
  is_working_day: boolean;
  day_type:
    | "working"
    | "weekend"
    | "holiday"
    | "force_working"
    | "force_holiday";
  reason: string;
}

export interface WorkingDayNavigationResult extends WorkingDayInfo {
  days_skipped: number;
}

export interface WorkingDayNavigationParams {
  date: string; // YYYY-MM-DD format
  direction: "previous" | "next";
  class_id?: string;
  for_teachers?: boolean;
}

export interface WorkingDayInfoParams {
  date: string; // YYYY-MM-DD format
  class_id?: string;
  for_teachers?: boolean;
}
