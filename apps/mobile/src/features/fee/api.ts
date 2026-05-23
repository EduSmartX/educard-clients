/**
 * Fee API — Admin endpoints for Mobile
 *
 * Mirrors the shared API factory but uses the mobile apiClient directly.
 */

import type {
  FeeStructure,
  FeeStructureCreatePayload,
  FeeStructureUpdatePayload,
  FeeStructureFilters,
  ClassChangeImpact,
  StudentFee,
  StudentFeeCreatePayload,
  StudentFeeUpdatePayload,
  StudentFeeComponentUpdatePayload,
  ComponentReviewPayload,
  StudentFeeFilters,
  FeePayment,
  PaymentCreatePayload,
  PaymentFilters,
  FeeDashboard,
  SendReminderPayload,
  BulkReminderPayload,
  ReminderResult,
  PaginatedResponse,
  ApiResponse,
} from '@educard/shared';
import { API_ENDPOINTS } from '@educard/shared';

import { apiClient } from '@/api/client';

// ─── Fee Structure ────────────────────────────────────────────────────────────

export async function fetchFeeStructures(
  params?: FeeStructureFilters
): Promise<PaginatedResponse<FeeStructure>> {
  const res = await apiClient.get<PaginatedResponse<FeeStructure>>(
    API_ENDPOINTS.FEE.ADMIN.STRUCTURES.LIST,
    { params }
  );
  return res.data;
}

export async function fetchFeeStructure(id: string): Promise<FeeStructure> {
  const res = await apiClient.get<ApiResponse<FeeStructure>>(
    API_ENDPOINTS.FEE.ADMIN.STRUCTURES.DETAIL(id)
  );
  return res.data.data;
}

export async function createFeeStructure(data: FeeStructureCreatePayload): Promise<FeeStructure> {
  const res = await apiClient.post<ApiResponse<FeeStructure>>(
    API_ENDPOINTS.FEE.ADMIN.STRUCTURES.CREATE,
    data
  );
  return res.data.data;
}

export async function updateFeeStructure(
  id: string,
  data: FeeStructureUpdatePayload
): Promise<FeeStructure> {
  const res = await apiClient.patch<ApiResponse<FeeStructure>>(
    API_ENDPOINTS.FEE.ADMIN.STRUCTURES.UPDATE(id),
    data
  );
  return res.data.data;
}

export async function deleteFeeStructure(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.FEE.ADMIN.STRUCTURES.DELETE(id));
}

export async function fetchClassChangeImpact(
  id: string,
  classPublicIds: string[]
): Promise<ClassChangeImpact> {
  const res = await apiClient.post<ApiResponse<ClassChangeImpact>>(
    API_ENDPOINTS.FEE.ADMIN.STRUCTURES.CLASS_CHANGE_IMPACT(id),
    { class_public_ids: classPublicIds }
  );
  return res.data.data;
}

// ─── Student Fees ─────────────────────────────────────────────────────────────

export async function fetchStudentFees(
  params?: StudentFeeFilters
): Promise<PaginatedResponse<StudentFee>> {
  const res = await apiClient.get<PaginatedResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.LIST,
    { params }
  );
  return res.data;
}

export async function fetchStudentFee(id: string): Promise<StudentFee> {
  const res = await apiClient.get<ApiResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.DETAIL(id)
  );
  return res.data.data;
}

export async function createStudentFee(data: StudentFeeCreatePayload): Promise<StudentFee> {
  const res = await apiClient.post<ApiResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.CREATE,
    data
  );
  return res.data.data;
}

export async function updateStudentFee(
  id: string,
  data: StudentFeeUpdatePayload
): Promise<StudentFee> {
  const res = await apiClient.patch<ApiResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.UPDATE(id),
    data
  );
  return res.data.data;
}

export async function deleteStudentFee(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.DELETE(id));
}

export async function updateStudentFeeComponents(
  id: string,
  data: StudentFeeComponentUpdatePayload
): Promise<StudentFee> {
  const res = await apiClient.post<ApiResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.UPDATE_COMPONENTS(id),
    data
  );
  return res.data.data;
}

export async function reviewComponentRequests(
  id: string,
  data: ComponentReviewPayload
): Promise<StudentFee> {
  const res = await apiClient.post<ApiResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.REVIEW_COMPONENT_REQUESTS(id),
    data
  );
  return res.data.data;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function fetchPayments(
  params?: PaymentFilters
): Promise<PaginatedResponse<FeePayment>> {
  const res = await apiClient.get<PaginatedResponse<FeePayment>>(
    API_ENDPOINTS.FEE.ADMIN.PAYMENTS.LIST,
    { params }
  );
  return res.data;
}

export async function fetchPayment(id: string): Promise<FeePayment> {
  const res = await apiClient.get<ApiResponse<FeePayment>>(
    API_ENDPOINTS.FEE.ADMIN.PAYMENTS.DETAIL(id)
  );
  return res.data.data;
}

export async function recordPayment(data: PaymentCreatePayload): Promise<FeePayment> {
  const res = await apiClient.post<ApiResponse<FeePayment>>(
    API_ENDPOINTS.FEE.ADMIN.PAYMENTS.CREATE,
    data
  );
  return res.data.data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchFeeDashboard(): Promise<FeeDashboard> {
  const res = await apiClient.get<ApiResponse<FeeDashboard>>(
    API_ENDPOINTS.FEE.ADMIN.DASHBOARD.LIST
  );
  return res.data.data;
}

export async function fetchDefaulters(
  paidPercentageLt?: number
): Promise<PaginatedResponse<StudentFee>> {
  const res = await apiClient.get<PaginatedResponse<StudentFee>>(
    API_ENDPOINTS.FEE.ADMIN.DASHBOARD.DEFAULTERS,
    { params: { paid_percentage_lt: paidPercentageLt } }
  );
  return res.data;
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function sendFeeReminder(data: SendReminderPayload): Promise<ReminderResult> {
  const res = await apiClient.post<ApiResponse<ReminderResult>>(
    API_ENDPOINTS.FEE.ADMIN.REMINDERS.CREATE,
    data
  );
  return res.data.data;
}

export async function sendBulkFeeReminder(data: BulkReminderPayload): Promise<ReminderResult> {
  const res = await apiClient.post<ApiResponse<ReminderResult>>(
    API_ENDPOINTS.FEE.ADMIN.REMINDERS.BULK,
    data
  );
  return res.data.data;
}

// ─── Eligible Students (lightweight dropdown) ─────────────────────────────────

export interface EligibleStudent {
  public_id: string;
  full_name: string;
  roll_number: string;
  admission_number: string;
}

export async function fetchEligibleStudents(params: {
  class_id: string;
  search?: string;
}): Promise<EligibleStudent[]> {
  const res = await apiClient.get<ApiResponse<EligibleStudent[]>>(
    API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.ELIGIBLE_STUDENTS,
    { params }
  );
  return res.data.data;
}
