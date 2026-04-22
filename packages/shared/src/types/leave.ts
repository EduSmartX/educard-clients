/**
 * Leave Management Types
 * 
 * Type definitions for employee leave management including leave types,
 * balances, requests, approvals, and leave policies/calendar.
 * Used across Web, iOS, and Android for consistent data handling.
 * 
 * @module types/leave
 */

import type { AuditFields, BaseQueryParams } from './common';

// Leave Type Definitions

export interface LeaveType {
  public_id: string;
  name: string;
  code: string;
  description?: string;
  max_days_per_year: number;
  is_paid: boolean;
  requires_approval: boolean;
  is_active: boolean;
  color?: string;
}

export interface LeaveBalance {
  public_id: string;
  leave_type: LeaveType;
  total_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
  carry_forward_days: number;
  year: number;
}

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Leave Request Types

export interface LeaveRequest extends AuditFields {
  public_id: string;
  employee: {
    public_id: string;
    full_name: string;
    email: string;
    employee_id?: string;
    profile_photo_thumbnail?: string | null;
    designation?: string;
    department?: string;
  };
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: LeaveRequestStatus;
  approver?: {
    public_id: string;
    full_name: string;
    email: string;
  };
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  supporting_document?: string | null;
  is_half_day?: boolean;
  half_day_type?: 'first_half' | 'second_half';
}

export interface LeaveRequestDetail extends LeaveRequest {
  approval_history?: LeaveApprovalHistory[];
  attachments?: LeaveAttachment[];
}

export interface LeaveApprovalHistory {
  public_id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'forwarded';
  actor: {
    public_id: string;
    full_name: string;
    email: string;
  };
  action_at: string;
  remarks?: string;
}

export interface LeaveAttachment {
  public_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

// Request Payloads

export interface CreateLeaveRequestPayload {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_half_day?: boolean;
  half_day_type?: 'first_half' | 'second_half';
  supporting_document?: File | null;
}

export interface UpdateLeaveRequestPayload {
  start_date?: string;
  end_date?: string;
  reason?: string;
  is_half_day?: boolean;
  half_day_type?: 'first_half' | 'second_half';
}

export interface ApproveLeavePayload {
  remarks?: string;
}

export interface RejectLeavePayload {
  rejection_reason: string;
}

export interface CancelLeavePayload {
  cancellation_reason: string;
}

// Query Parameters

export interface LeaveRequestQueryParams extends BaseQueryParams {
  employee_id?: string;
  leave_type_id?: string;
  status?: LeaveRequestStatus;
  start_date?: string;
  end_date?: string;
  year?: number;
  month?: number;
  is_pending_approval?: boolean;
}

// Working Days & Reports

export interface WorkingDaysCalculation {
  start_date: string;
  end_date: string;
  total_days: number;
  working_days: number;
  holidays: number;
  weekends: number;
  is_half_day: boolean;
}

export interface LeaveSummary {
  employee_id: string;
  employee_name: string;
  year: number;
  balances: LeaveBalance[];
  total_leaves_taken: number;
  total_leaves_available: number;
  pending_requests: number;
}

export interface TeamLeaveCalendar {
  date: string;
  leaves: {
    employee_id: string;
    employee_name: string;
    leave_type: string;
    is_half_day: boolean;
    half_day_type?: 'first_half' | 'second_half';
  }[];
}

// Leave Policy

export interface LeavePolicy {
  public_id: string;
  name: string;
  description?: string;
  leave_types: LeaveType[];
  applicable_to: 'all' | 'teachers' | 'staff';
  is_active: boolean;
  effective_from: string;
  effective_to?: string | null;
}
