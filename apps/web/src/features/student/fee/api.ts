import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface FeeSummary {
  total_fee: number;
  total_paid: number;
  total_pending: number;
  total_discount: number;
}

export interface Payment {
  public_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  reference_number?: string;
}

interface ApiResponse<T> {
  data: T;
}

export async function getFeeSummary(): Promise<FeeSummary> {
  const res = await api.get<ApiResponse<FeeSummary>>(API_ENDPOINTS.STUDENT_PORTAL.FEE.SUMMARY);
  return res.data.data;
}

export async function getFeePayments(): Promise<Payment[]> {
  const res = await api.get<ApiResponse<Payment[]>>(API_ENDPOINTS.STUDENT_PORTAL.FEE.PAYMENTS);
  return res.data.data;
}
