/**
 * Leave Management API
 * Types imported from @educard/shared for consistency
 */

import { apiClient } from '@/api/client';
import { safeDeleteVoid } from '@/api/shared-api-utils';

// Re-export types from shared
export type { LeaveRequestStatus } from '@educard/shared';

// Types - keeping inline for backward compatibility but could be moved to shared
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
  roles_details?: Array<{ id: number; name: string; code?: string }>;
  leave_type?: { id: number; name: string; code?: string } | null;
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
  params?: LeaveAllocationQueryParams,
): Promise<ApiListResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiListResponse<LeaveAllocation>>(
    '/leave/admin/allocations/',
    { params },
  );
  return response.data;
}

/**
 * Get leave allocations for employee (read-only view)
 */
export async function getEmployeeLeaveAllocations(
  params?: LeaveAllocationQueryParams,
): Promise<ApiListResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiListResponse<LeaveAllocation>>(
    '/leave/employee/allocations/',
    { params },
  );
  return response.data;
}

export async function getLeaveAllocationById(
  publicId: string,
): Promise<ApiDetailResponse<LeaveAllocation>> {
  const response = await apiClient.get<ApiDetailResponse<LeaveAllocation>>(
    `/leave/admin/allocations/${publicId}/`,
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
    data,
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
  }>,
): Promise<ApiDetailResponse<LeaveAllocation>> {
  const response = await apiClient.patch<ApiDetailResponse<LeaveAllocation>>(
    `/leave/admin/allocations/${publicId}/`,
    data,
  );
  return response.data;
}

export async function deleteLeaveAllocation(publicId: string): Promise<void> {
  return safeDeleteVoid(`/leave/admin/allocations/${publicId}/`);
}

// Leave Approvals API

export async function getLeaveReviews(
  params?: LeaveReviewQueryParams,
): Promise<ApiListResponse<LeaveRequest>> {
  const response = await apiClient.get<ApiListResponse<LeaveRequest>>(
    '/leave/employee/reviews/',
    {
      params,
    },
  );
  return response.data;
}

export async function getLeaveReviewById(
  publicId: string,
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.get<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/`,
  );
  return response.data;
}

export async function approveLeaveRequest(
  publicId: string,
  data?: { review_comments?: string },
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/approve/`,
    data ?? {},
  );
  return response.data;
}

export async function rejectLeaveRequest(
  publicId: string,
  data?: { review_comments?: string },
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/employee/reviews/${publicId}/reject/`,
    data ?? {},
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

export async function getMyLeaveBalances(): Promise<
  ApiDetailResponse<LeaveBalanceSummary[]>
> {
  const response = await apiClient.get<
    ApiDetailResponse<LeaveBalanceSummary[]>
  >('/leave/employee/balances/my-balance/');
  return response.data;
}

export async function getMyLeaveRequests(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<ApiListResponse<MyLeaveRequest>> {
  const response = await apiClient.get<ApiListResponse<MyLeaveRequest>>(
    '/leave/user/requests/',
    {
      params,
    },
  );
  return response.data;
}

export async function createLeaveRequest(
  data: CreateLeaveRequestPayload,
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    '/leave/user/requests/',
    data,
  );
  return response.data;
}

export async function cancelMyLeaveRequest(
  publicId: string,
): Promise<ApiDetailResponse<LeaveRequest>> {
  const response = await apiClient.post<ApiDetailResponse<LeaveRequest>>(
    `/leave/user/requests/${publicId}/cancel/`,
  );
  return response.data;
}

export interface HolidayInfo {
  date: string;
  name?: string;
  description?: string;
  type: string;
}

export interface WorkingDaysCalculation {
  working_days: number;
  total_days: number;
  weekends?: number;
  holidays: HolidayInfo[];
  leave_days?: number;
}

export async function calculateWorkingDays(
  startDate: string,
  endDate: string,
): Promise<ApiDetailResponse<WorkingDaysCalculation>> {
  const response = await apiClient.post<
    ApiDetailResponse<WorkingDaysCalculation>
  >('/leave/user/requests/calculate-working-days/', {
    start_date: startDate,
    end_date: endDate,
  });
  return response.data;
}

// Leave Balance Management API (admin / class-teacher / supervisor)

export interface LeaveBalanceUser {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
}

export interface LeaveBalanceAllocation {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  display_name: string;
  total_days: number | string;
  max_carry_forward_days: number | string;
  effective_from?: string | null;
  effective_to?: string | null;
}

export interface LeaveBalance {
  public_id: string;
  user: LeaveBalanceUser;
  leave_allocation: LeaveBalanceAllocation;
  leave_name: string;
  total_allocated: number;
  available: number;
  pending: number;
  used: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface UserLeaveBalancesResponse {
  message: string;
  data: {
    user: LeaveBalanceUser | null;
    balances: LeaveBalance[];
  };
}

export interface LeaveAllocationForUser {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  display_name: string;
  total_days: number | string;
  max_carry_forward_days: number | string;
}

export interface TeacherManagementContext {
  is_supervisor: boolean;
  subordinate_count: number;
  is_class_teacher: boolean;
  student_count: number;
  can_review_requests: boolean;
  can_manage_balances: boolean;
  can_manage_allocations: boolean;
}

export interface CreateLeaveBalancePayload {
  leave_allocation: string;
  total_allocated: number;
  user: string;
}

export interface UpdateLeaveBalancePayload {
  public_id: string;
  total_allocated: number;
  carried_forward: number;
}

export async function getTeacherManagementContext(): Promise<TeacherManagementContext> {
  const response = await apiClient.get<{ data: TeacherManagementContext }>(
    '/leave/employee/reviews/management-context/',
  );
  return response.data.data;
}

export async function getUserLeaveBalances(
  userId: string,
): Promise<UserLeaveBalancesResponse> {
  const response = await apiClient.get<UserLeaveBalancesResponse>(
    `/leave/employee/balances/user/${userId}/`,
  );
  return response.data;
}

export async function getUserLeaveAllocations(
  userId: string,
): Promise<LeaveAllocationForUser[]> {
  const response = await apiClient.get<
    { data?: LeaveAllocationForUser[] } | LeaveAllocationForUser[]
  >(`/leave/employee/allocations/?user_public_id=${userId}`);
  const body = response.data as { data?: LeaveAllocationForUser[] };
  const data = Array.isArray(response.data) ? response.data : body.data;
  return Array.isArray(data) ? data : [];
}

export async function createLeaveBalance(
  payload: CreateLeaveBalancePayload,
): Promise<unknown> {
  const response = await apiClient.post('/leave/employee/balances/', payload);
  return response.data;
}

export async function updateLeaveBalance(
  payload: UpdateLeaveBalancePayload,
): Promise<unknown> {
  const response = await apiClient.patch(
    `/leave/employee/balances/${payload.public_id}/`,
    {
      total_allocated: payload.total_allocated,
      carried_forward: payload.carried_forward,
    },
  );
  return response.data;
}

export async function deleteLeaveBalance(balanceId: string): Promise<void> {
  return safeDeleteVoid(`/leave/employee/balances/${balanceId}/`);
}
