/**
 * API Client for Leave Management
 */
import apiClient from '@/lib/api';
import type {
  ApiListResponse,
  ApiSingleResponse,
  CalculateWorkingDaysPayload,
  CancelLeaveRequestPayload,
  CreateLeaveRequestPayload,
  LeaveBalance,
  LeaveBalanceQueryParams,
  LeaveBalanceSummary,
  LeaveRequest,
  LeaveRequestQueryParams,
  UpdateLeaveRequestPayload,
  WorkingDaysCalculation,
} from '../types';

// ===========================
// Leave Balance APIs
// ===========================

/**
 * Fetch leave balances for current user
 */
export async function fetchMyLeaveBalances(
  params?: LeaveBalanceQueryParams
): Promise<ApiListResponse<LeaveBalance>> {
  const response = await apiClient.get('/leave/leave-balances/', { params });
  return response.data;
}

/**
 * Fetch leave balance summary for dashboard
 */
export async function fetchMyLeaveBalancesSummary(): Promise<
  ApiSingleResponse<LeaveBalanceSummary[]>
> {
  const response = await apiClient.get('/leave/leave-balances/my-balance/');
  return response.data;
}

/**
 * Fetch leave balances for a specific user (manageable by current user)
 */
export async function fetchUserLeaveBalances(
  userPublicId: string,
  params?: LeaveBalanceQueryParams
): Promise<ApiListResponse<LeaveBalance>> {
  const response = await apiClient.get(`/leave/leave-balances/user/${userPublicId}/`, { params });
  return response.data;
}

/**
 * Fetch leave balance summary for a specific user
 */
export async function fetchUserLeaveBalancesSummary(
  userPublicId: string
): Promise<ApiSingleResponse<LeaveBalanceSummary[]>> {
  const response = await apiClient.get(`/leave/leave-balances/user/${userPublicId}/`);
  return response.data;
}

/**
 * Fetch single leave balance by public_id
 */
export async function fetchLeaveBalance(
  publicId: string
): Promise<ApiSingleResponse<LeaveBalance>> {
  const response = await apiClient.get(`/leave/leave-balances/${publicId}/`);
  return response.data;
}

// ===========================
// Leave Request APIs
// ===========================

/**
 * Fetch leave requests for current user
 */
export async function fetchMyLeaveRequests(
  params?: LeaveRequestQueryParams
): Promise<ApiListResponse<LeaveRequest>> {
  const response = await apiClient.get('/leave/leave-requests/', { params });
  return response.data;
}

/**
 * Fetch leave requests for a specific user (manageable by current user)
 */
export async function fetchUserLeaveRequests(
  userPublicId: string,
  params?: LeaveRequestQueryParams
): Promise<ApiListResponse<LeaveRequest>> {
  const response = await apiClient.get('/leave/leave-requests/', {
    params: {
      ...params,
      user: userPublicId,
    },
  });
  return response.data;
}

/**
 * Fetch single leave request by public_id
 */
export async function fetchLeaveRequest(
  publicId: string,
  isDeleted = false
): Promise<ApiSingleResponse<LeaveRequest>> {
  const params = isDeleted ? { is_deleted: 'true' } : {};
  const response = await apiClient.get(`/leave/leave-requests/${publicId}/`, { params });
  return response.data;
}

/**
 * Create a new leave request
 */
export async function createLeaveRequest(
  data: CreateLeaveRequestPayload
): Promise<ApiSingleResponse<LeaveRequest>> {
  const response = await apiClient.post('/leave/leave-requests/', data);
  return response.data;
}

/**
 * Update an existing leave request (only pending requests)
 */
export async function updateLeaveRequest(
  publicId: string,
  data: UpdateLeaveRequestPayload
): Promise<ApiSingleResponse<LeaveRequest>> {
  const response = await apiClient.patch(`/leave/leave-requests/${publicId}/`, data);
  return response.data;
}

/**
 * Cancel a leave request
 */
export async function cancelLeaveRequest(
  publicId: string,
  data?: CancelLeaveRequestPayload
): Promise<ApiSingleResponse<LeaveRequest>> {
  const response = await apiClient.post(`/leave/leave-requests/${publicId}/cancel/`, data || {});
  return response.data;
}

/**
 * Delete a leave request (soft delete)
 */
export async function deleteLeaveRequest(publicId: string): Promise<void> {
  await apiClient.delete(`/leave/leave-requests/${publicId}/`);
}

/**
 * Reactivate a deleted leave request
 */
export async function reactivateLeaveRequest(
  publicId: string
): Promise<ApiSingleResponse<LeaveRequest>> {
  const response = await apiClient.post(`/leave/leave-requests/${publicId}/reactivate/`);
  return response.data;
}

/**
 * Calculate working days for a date range
 */
export async function calculateWorkingDays(
  data: CalculateWorkingDaysPayload
): Promise<ApiSingleResponse<WorkingDaysCalculation>> {
  const response = await apiClient.post('/leave/leave-requests/calculate-working-days/', data);
  return response.data;
}
