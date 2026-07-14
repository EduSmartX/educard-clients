import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface LeaveBalance {
  public_id: string;
  leave_type_code: string;
  leave_name: string;
  total_allocated: number;
  used: number;
  carried_forward: number;
  pending: number;
  available: number;
}

export interface LeaveRequest {
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

interface ApiResponse<T> {
  data: T;
}

export async function getLeaveBalance(): Promise<LeaveBalance[]> {
  const res = await api.get<ApiResponse<LeaveBalance[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.BALANCE
  );
  return res.data.data;
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const res = await api.get<ApiResponse<LeaveRequest[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.REQUESTS
  );
  // Paginated response: data is the array directly (custom pagination wrapper)
  return Array.isArray(res.data.data) ? res.data.data : [];
}

export interface ApplyLeavePayload {
  leave_balance: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
}

export async function applyLeaveRequest(data: ApplyLeavePayload): Promise<LeaveRequest> {
  const res = await api.post<ApiResponse<LeaveRequest>>(
    API_ENDPOINTS.STUDENT_PORTAL.LEAVE.REQUESTS,
    data
  );
  return res.data.data;
}
