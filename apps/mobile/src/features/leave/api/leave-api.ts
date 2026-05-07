/**
 * Leave Management API
 */

import { apiClient } from '@/api/client';

// Types

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

// Leave Allocations API

/**
 * Get leave allocations (Admin view - full list with CRUD)
 */
export async function getLeaveAllocations(
  params?: LeaveAllocationQueryParams
): Promise<ApiListResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiListResponse<LeaveAllocation>>(
    '/leave/admin/allocations/',
    { params }
  );
  return response.data;
}

/**
 * Get leave allocations for employee (read-only view)
 */
export async function getEmployeeLeaveAllocations(
  params?: LeaveAllocationQueryParams
): Promise<ApiListResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiListResponse<LeaveAllocation>>(
    '/leave/employee/allocations/',
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
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    const status = axiosError?.response?.status;
    if (status && status >= 200 && status < 300) return;
    if (axiosError?.message === 'Network Error' && !axiosError?.response) return;
    throw error;
  }
}

// Leave Approvals API

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
    data ?? {}
  );
  return response.data;
}

export async function rejectLeaveRequest(
  publicId: string,
  data?: { review_comments?: string }
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/reject/`,
    data ?? {}
  );
  return response.data;
}

// Leave Balance & Request API

export interface LeaveAllocationSimple {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  display_name: string;
  total_days: string;
  max_carry_forward_days: string;
  effective_from: string | null;
  effective_to: string | null;
}

export interface LeaveBalanceSummary {
  public_id: string;
  leave_allocation: LeaveAllocationSimple;
  leave_name: string;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
}

export interface CreateLeaveRequestPayload {
  leave_balance: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
}

export interface MyLeaveRequest extends LeaveRequest {
  can_be_cancelled: boolean;
}

export async function getMyLeaveBalances(): Promise<ApiDetailResponse<LeaveBalanceSummary[]>> {
  const response = await apiClient.get<ApiDetailResponse<LeaveBalanceSummary[]>>(
    '/leave/employee/balances/my-balance/'
  );
  return response.data;
}

export async function getMyLeaveRequests(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<ApiListResponse<MyLeaveRequest>> {
  const response = await apiClient.get<ApiListResponse<MyLeaveRequest>>('/leave/user/requests/', {
    params,
  });
  return response.data;
}

export async function createLeaveRequest(
  data: CreateLeaveRequestPayload
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    '/leave/user/requests/',
    data
  );
  return response.data;
}

export async function cancelMyLeaveRequest(
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
): Promise<ApiDetailResponse<{ working_days: number; holidays: string[] }>> {
  const response = await apiClient.post<
    ApiDetailResponse<{ working_days: number; holidays: string[] }>
  >('/leave/employee/calculate-working-days/', { start_date: startDate, end_date: endDate });
  return response.data;
}
