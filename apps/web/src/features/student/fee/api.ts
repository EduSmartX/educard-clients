import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface FeeSummary {
  public_id: string;
  total_amount: number;
  base_amount: number;
  discount_percentage: number;
  discount_amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  paid_percentage: number;
  is_overdue: boolean;
  is_locked: boolean;
  due_date: string | null;
}

export interface Payment {
  public_id: string;
  amount: number;
  transaction_type: string;
  payment_mode: string;
  payment_date: string;
  receipt_number: string | null;
  remarks: string;
  created_at: string;
}

export interface FeeComponent {
  public_id: string;
  name: string;
  amount: number;
  component_type: 'mandatory' | 'optional';
  is_selected: boolean;
  approval_status: 'none' | 'pending' | 'approved' | 'rejected';
  request_note: string;
  admin_note: string;
  can_request_change: boolean;
}

interface ApiResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

export async function getFeeSummary(): Promise<FeeSummary> {
  const res = await api.get<ApiResponse<FeeSummary>>(API_ENDPOINTS.STUDENT_PORTAL.FEE.SUMMARY);
  return res.data.data;
}

export async function getFeePayments(): Promise<Payment[]> {
  const res = await api.get<ApiResponse<PaginatedResponse<Payment>>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.PAYMENTS
  );
  return res.data.data?.results ?? (res.data.data as unknown as Payment[]);
}

export async function getFeeComponents(): Promise<FeeComponent[]> {
  const res = await api.get<ApiResponse<PaginatedResponse<FeeComponent>>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.COMPONENTS
  );
  return res.data.data?.results ?? (res.data.data as unknown as FeeComponent[]);
}

export async function requestOptOut(publicId: string, requestNote: string): Promise<FeeComponent> {
  const res = await api.post<ApiResponse<FeeComponent>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.COMPONENT_OPT_OUT(publicId),
    { request_note: requestNote }
  );
  return res.data.data;
}

export async function requestOptIn(publicId: string, requestNote: string): Promise<FeeComponent> {
  const res = await api.post<ApiResponse<FeeComponent>>(
    API_ENDPOINTS.STUDENT_PORTAL.FEE.COMPONENT_OPT_IN(publicId),
    { request_note: requestNote }
  );
  return res.data.data;
}
