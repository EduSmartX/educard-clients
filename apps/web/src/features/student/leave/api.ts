import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface LeaveBalance {
  leave_type: string;
  leave_type_name: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  public_id: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
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
  return res.data.data;
}
