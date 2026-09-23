export interface TimesheetSubmission {
  public_id: string;
  employee_info: {
    public_id: string;
    username: string;
    full_name: string;
    email: string;
    phone: string;
    gender: string;
    role: string;
    organization_role: string | null;
  };
  week_start_date: string;
  week_end_date: string;
  submission_status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'REJECTED';
  status_display: string;
  submitted_at: string | null;
  submitted_by_info: {
    public_id: string;
    username: string;
    full_name: string;
    email: string;
  } | null;
  reviewed_at: string | null;
  reviewed_by_info: {
    public_id: string;
    username: string;
    full_name: string;
    email: string;
  } | null;
  review_comments: string;
  total_working_days: number;
  total_present_days: string | number;
  total_absent_days: string | number;
  total_half_days: number;
  total_leave_days: number;
  total_holidays: number;
  attendance_percentage: string;
  created_at: string;
  updated_at: string;
}
