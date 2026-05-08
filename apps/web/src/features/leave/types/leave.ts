/**
 * Leave Management Type Definitions
 */

// Leave Balance Types
export interface LeaveBalance {
  public_id: string;
  user: {
    public_id: string;
    first_name: string;
    last_name: string;
    email: string;
    full_name: string;
  };
  leave_allocation: {
    public_id: string;
    leave_type_name: string;
    leave_type_code: string;
    display_name: string;
    total_days: number;
    max_carry_forward_days: number;
    effective_from: string;
    effective_to: string;
  };
  leave_name: string;
  total_allocated: number;
  available: number;
  pending: number;
  used: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalanceSummary {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  leave_name?: string;
  display_name?: string;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
  leave_allocation?: {
    display_name?: string;
    leave_type_name: string;
  };
}

// Leave Request Types
export const LeaveRequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type LeaveRequestStatus = (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus];

export interface LeaveRequest {
  public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  organization_role: string | { code: string; name: string } | null;
  email: string;
  supervisor_name: string;
  supervisor_public_id: string;
  leave_balance_public_id: string;
  leave_type_code: string;
  leave_type_name: string;
  leave_name: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: LeaveRequestStatus;
  applied_at: string;
  attachment_url: string | null;
  attachment_name: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  can_be_cancelled: boolean;
  created_at: string;
  updated_at: string;
  created_by_public_id?: string;
  created_by_name?: string;
  updated_by_public_id?: string;
  updated_by_name?: string;
}

// Holiday Info Type
export interface HolidayInfo {
  date: string;
  name?: string;
  description?: string;
  type: string;
}

// Working Days Calculation
export interface WorkingDaysCalculation {
  working_days: number;
  total_days: number;
  weekends: number;
  holidays: HolidayInfo[];
  leave_days: number;
}

// Query Parameters
export interface LeaveRequestQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  status__in?: string;
  leave_type__name?: string;
  start_date?: string;
  start_date__gte?: string;
  start_date__lte?: string;
  end_date?: string;
  end_date__gte?: string;
  end_date__lte?: string;
  ordering?: string;
  search?: string;
}

export interface LeaveBalanceQueryParams {
  page?: number;
  page_size?: number;
  user?: string;
  leave_allocation?: string;
}

// Payloads
export interface CreateLeaveRequestPayload {
  leave_balance: string; // public_id
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  attachment?: File | null;
}

export interface UpdateLeaveRequestPayload {
  start_date?: string;
  end_date?: string;
  number_of_days?: number;
  reason?: string;
  attachment?: File | null;
  remove_attachment?: boolean;
}

export interface CalculateWorkingDaysPayload {
  start_date: string;
  end_date: string;
}

export interface CancelLeaveRequestPayload {
  cancellation_reason?: string;
}

// Status Configuration
export interface StatusConfig {
  label: string;
  className: string;
  textColor: string;
  bgColor: string;
}

export const LEAVE_STATUS_CONFIG: Record<LeaveRequestStatus, StatusConfig> = {
  [LeaveRequestStatus.PENDING]: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
    textColor: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
  [LeaveRequestStatus.APPROVED]: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800',
    textColor: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  [LeaveRequestStatus.REJECTED]: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
    textColor: 'text-red-800',
    bgColor: 'bg-red-100',
  },
  [LeaveRequestStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800',
    textColor: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
};

// API Response Types
export interface ApiListResponse<T> {
  message: string;
  data: T[];
  pagination: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface ApiSingleResponse<T> {
  message: string;
  data: T;
}
