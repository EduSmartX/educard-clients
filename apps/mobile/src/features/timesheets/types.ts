/**
 * Shared types for the timesheet/attendance feature.
 */

export interface AttendanceRecord {
  date: string;
  morning_present: boolean | null;
  afternoon_present: boolean | null;
  is_leave?: boolean;
  leave_type_name?: string | null;
  leave_status?: string | null;
  approval_status?: string | null;
}

export interface HolidayDescription {
  type: 'weekend' | 'official_holiday' | 'holiday' | 'force_holiday' | 'force_working';
  name: string;
  description?: string;
}

export interface EmployeeAttendanceResponse {
  records: AttendanceRecord[];
  stats: {
    total_working_days?: number;
    total_present?: number;
    total_absent?: number;
    total_half_days?: number;
    total_leaves?: number;
    total_holidays?: number;
  };
  working_day_policy: { sunday_off: boolean; saturday_off_pattern: string } | null;
  holiday_descriptions?: Record<string, HolidayDescription>;
  calendar_exceptions?: { date: string; type: string; reason: string }[];
  submission_config?: { default_present?: boolean };
}

export interface TimesheetStatusResponse {
  submission: {
    submission_status: string;
    review_comments?: string;
    reviewed_by_name?: string | null;
    reviewed_at?: string | null;
  } | null;
}

export type DayState =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'leave-approved'
  | 'leave-pending'
  | 'holiday'
  | 'none'
  | 'future';

export type WeekRow = {
  date: string;
  dayName: string;
  morning_present: boolean;
  afternoon_present: boolean;
  locked_reason?: 'holiday' | 'leave' | 'non_working_day';
  holiday_name?: string;
  leave_name?: string;
  is_working_day: boolean;
};

export type WeekBlock = {
  id: string;
  start: string;
  end: string;
  rows: WeekRow[];
  collapsed: boolean;
  submissionStatus?: string | null;
  reviewComments?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
};
