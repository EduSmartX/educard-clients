/**
 * Leave Management — API Layer
 * Leave Allocations, Approvals, Balances
 */

import { apiClient } from '@/api/client';

// ============================================================================
// Types (leave-specific only; LeaveType & OrganizationRole come from core)
// ============================================================================

export interface LeaveAllocation {
  public_id: string;
  leave_type_id: number;
  leave_type_name: string;
  name: string | null;
  description: string | null;
  total_days: string;
  max_carry_forward_days: string;
  applies_to_all_roles: boolean;
  roles: string;
  role_ids?: number[];
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  attachment_url: string | null;
  attachment_name: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  can_be_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
}

export interface ApiDetailResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LeaveAllocationQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  leave_type?: number;
  ordering?: string;
}

export interface LeaveReviewQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
  start_date__gte?: string;
  start_date__lte?: string;
  user?: string;
  user__name?: string;
}

// ============================================================================
// Leave Allocations API (Admin)
// ============================================================================

export async function getLeaveAllocations(
  params?: LeaveAllocationQueryParams
): Promise<ApiListResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiListResponse<LeaveAllocation>>(
    '/leave/admin/allocations/',
    { params }
  );
  return response.data;
}

export async function getLeaveAllocationById(
  publicId: string
): Promise<ApiDetailResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiDetailResponse<LeaveAllocation>>(
    `/leave/admin/allocations/${publicId}/`
  );
  return response.data;
}

export async function createLeaveAllocation(data: {
  leave_type: number;
  name: string;
  description?: string;
  total_days: string;
  max_carry_forward_days?: string;
  applies_to_all_roles?: boolean;
  roles?: number[];
  effective_from: string;
  effective_to?: string;
}): Promise<ApiDetailResponse<LeaveAllocation>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveAllocation>>(
    '/leave/admin/allocations/',
    data
  );
  return response.data;
}

export async function updateLeaveAllocation(
  publicId: string,
  data: Partial<{
    name: string;
    description: string;
    total_days: string;
    max_carry_forward_days: string;
    applies_to_all_roles: boolean;
    roles: number[];
    effective_from: string;
    effective_to: string;
  }>
): Promise<ApiDetailResponse<LeaveAllocation>> {
  const response = await apiClient.patch<ApiDetailResponse<LeaveAllocation>>(
    `/leave/admin/allocations/${publicId}/`,
    data
  );
  return response.data;
}

export async function deleteLeaveAllocation(publicId: string): Promise<void> {
  try {
    await apiClient.delete(`/leave/admin/allocations/${publicId}/`);
  } catch (error: any) {
    const status = error?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (error?.message === 'Network Error' && !error?.response) return;
    throw error;
  }
}

// ============================================================================
// Leave Approvals API (Employee reviews)
// ============================================================================

export async function getLeaveReviews(
  params?: LeaveReviewQueryParams
): Promise<ApiListResponse<LeaveRequest>> {
  const response = await apiClient.get<ApiListResponse<LeaveRequest>>('/leave/employee/reviews/', {
    params,
  });
  return response.data;
}

export async function getLeaveReviewById(
  publicId: string
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.get<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/`
  );
  return response.data;
}

export async function approveLeaveRequest(
  publicId: string,
  data?: { review_comments?: string }
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/approve/`,
    data || {}
  );
  return response.data;
}

export async function rejectLeaveRequest(
  publicId: string,
  data?: { review_comments?: string }
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/reject/`,
    data || {}
  );
  return response.data;
}

// ============================================================================
// Employee Leave Balances & User Leave Requests
// ============================================================================

export interface LeaveBalance {
  public_id: string;
  leave_name: string;
  leave_allocation: {
    public_id: string;
    leave_type_name: string;
    leave_type_code: string;
  };
  total_allocated: number;
  available: number;
  used: number;
  pending: number;
  carried_forward: number;
}

export interface LeaveRequestCreatePayload {
  leave_balance: string; // public_id of the leave balance
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
}

export async function getMyLeaveBalances(): Promise<ApiListResponse<LeaveBalance>> {
  const response = await apiClient.get<ApiListResponse<LeaveBalance>>('/leave/employee/balances/');
  return response.data;
}

export async function getMyLeaveRequests(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<ApiListResponse<LeaveRequest>> {
  const response = await apiClient.get<ApiListResponse<LeaveRequest>>('/leave/user/requests/', {
    params,
  });
  return response.data;
}

export async function createLeaveRequest(
  data: LeaveRequestCreatePayload
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    '/leave/user/requests/',
    data
  );
  return response.data;
}

export async function cancelLeaveRequest(
  publicId: string
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/user/requests/${publicId}/cancel/`
  );
  return response.data;
}

export async function calculateWorkingDays(
  startDate: string,
  endDate: string
): Promise<{ working_days: number }> {
  const response = await apiClient.post<{ success: boolean; data: { working_days: number } }>(
    '/leave/user/requests/calculate-working-days/',
    { start_date: startDate, end_date: endDate }
  );
  return response.data.data;
}
