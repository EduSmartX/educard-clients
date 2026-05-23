/**
 * Fee Hooks for Mobile
 * React Query hooks for fee data fetching
 */

import type {
  FeeStructureCreatePayload,
  PaymentCreatePayload,
  SendReminderPayload,
  StudentFeeFilters,
  PaymentFilters,
} from '@educard/shared';
import {
  createFeeStructureApi,
  createStudentFeeApi,
  createFeePaymentApi,
  createFeeDashboardApi,
  createFeeReminderApi,
  createParentFeeApi,
  FeeQueryKeys,
  FeeMessages,
} from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { handleMutationError, type MutationOptions } from '@/lib/mutation-utils';
import { showToast } from '@/utils/toast';

const feeStructureApi = createFeeStructureApi(apiClient);
const studentFeeApi = createStudentFeeApi(apiClient);
const feePaymentApi = createFeePaymentApi(apiClient);
const feeDashboardApi = createFeeDashboardApi(apiClient);
const feeReminderApi = createFeeReminderApi(apiClient);
const parentFeeApi = createParentFeeApi(apiClient);

// ============== QUERIES ==============

/**
 * Parent hooks - for viewing child's fees
 */
export function useParentStudentFees() {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_FEES],
    queryFn: () => parentFeeApi.list(),
  });
}

export function useParentStudentFeeDetail(id: string) {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_FEE_DETAIL, id],
    queryFn: () => parentFeeApi.get(id),
    enabled: !!id,
  });
}

export function useParentPaymentHistory() {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_PAYMENTS],
    queryFn: () => parentFeeApi.getPayments(''),
  });
}

/**
 * Admin hooks - for fee management
 */
export function useFeeStructures() {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_STRUCTURES],
    queryFn: () => feeStructureApi.list(),
  });
}

export function useFeeStructureDetail(id: string) {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_STRUCTURE_DETAIL, id],
    queryFn: () => feeStructureApi.get(id),
    enabled: !!id,
  });
}

export function useStudentFees(filters?: StudentFeeFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.STUDENT_FEES, filters],
    queryFn: () => studentFeeApi.list(filters),
  });
}

export function useStudentFeeDetail(id: string) {
  return useQuery({
    queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, id],
    queryFn: () => studentFeeApi.get(id),
    enabled: !!id,
  });
}

export function useFeePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENTS, filters],
    queryFn: () => feePaymentApi.list(filters),
  });
}

export function useRecentPayments(params?: { page_size?: number }) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENTS, 'recent', params],
    queryFn: () => feePaymentApi.list(params),
  });
}

export function useFeeDashboard() {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_DASHBOARD],
    queryFn: () => feeDashboardApi.get(),
  });
}

// ============== MUTATIONS ==============

export function useCreateFeeStructure(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeeStructureCreatePayload) => feeStructureApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_STRUCTURES] });
      showToast('success', FeeMessages.FEE_STRUCTURE_CREATED);
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create fee structure', options?.onError);
    },
  });
}

export function useUpdateFeeStructure(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeeStructureCreatePayload }) =>
      feeStructureApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_STRUCTURES] });
      showToast('success', FeeMessages.FEE_STRUCTURE_UPDATED);
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update fee structure', options?.onError);
    },
  });
}

export function useDeleteFeeStructure(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feeStructureApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_STRUCTURES] });
      showToast('success', FeeMessages.FEE_STRUCTURE_DELETED);
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete fee structure', options?.onError);
    },
  });
}

export function useRecordPayment(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentCreatePayload) => feePaymentApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.STUDENT_FEES] });
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.PAYMENTS] });
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_DASHBOARD] });
      showToast('success', FeeMessages.PAYMENT_RECORDED);
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to record payment', options?.onError);
    },
  });
}

export function useSendReminder(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendReminderPayload) => feeReminderApi.send(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.REMINDERS] });
      showToast('success', FeeMessages.REMINDER_SENT);
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to send reminder', options?.onError);
    },
  });
}
