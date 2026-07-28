/**
 * Student Leave API — Mobile
 * Student-facing leave balance + requests (distinct from employee leave endpoints).
 */

import { API_ENDPOINTS } from '@educard/shared';

import { apiClient } from '@/api/client';

interface ApiResponse<T> {
  data: T;
}

export interface StudentLeaveBalance {
  public_id: string;
  leave_type_code: string;
  leave_name: string;
  total_allocated: number;
  used: number;
  carried_forward: number;
  pending: number;
  available: number;
}

export interface StudentLeaveRequest {
  public_id: string;
  leave_name: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  review_comments: string;
}

export interface ApplyStudentLeavePayload {
  leave_balance: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
}

export async function getStudentLeaveBalance(): Promise<StudentLeaveBalance[]> {
  const res = await apiClient.get<ApiResponse<StudentLeaveBalance[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.BALANCE,
  );
  return res.data.data;
}

export async function getStudentLeaveRequests(): Promise<
  StudentLeaveRequest[]
> {
  const res = await apiClient.get<ApiResponse<StudentLeaveRequest[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.REQUESTS,
  );
  // Paginated response: data is the array directly (custom pagination wrapper)
  return Array.isArray(res.data.data) ? res.data.data : [];
}

export async function applyStudentLeave(
  data: ApplyStudentLeavePayload,
): Promise<StudentLeaveRequest> {
  const res = await apiClient.post<ApiResponse<StudentLeaveRequest>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.REQUESTS,
    data,
  );
  return res.data.data;
}
