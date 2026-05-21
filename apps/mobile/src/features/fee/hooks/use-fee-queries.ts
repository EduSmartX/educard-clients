/**
 * Fee Hooks for Mobile
 * React Query hooks for fee data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  feeStructureApi,
  studentFeeApi,
  feePaymentApi,
  feeDashboardApi,
  feeReminderApi,
} from '@educard/shared';
import type {
  FeeStructurePayload,
  FeePaymentPayload,
  FeeReminderPayload,
  FeeStatus,
  StudentFeeFilters,
  PaymentFilters,
} from '@educard/shared';
import { FeeQueryKeys, FeeMessages } from '@educard/shared';
import { showToast } from '@/utils/toast';

// ============== QUERIES ==============

/**
 * Parent hooks - for viewing child's fees
 */
export function useParentStudentFees() {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_FEES],
    queryFn: () => studentFeeApi.getParentStudentFees(),
  });
}

export function useParentStudentFeeDetail(id: string) {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_FEE_DETAIL, id],
    queryFn: () => studentFeeApi.getParentStudentFeeDetail(id),
    enabled: !!id,
  });
}

export function useParentPaymentHistory() {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_PAYMENTS],
    queryFn: () => feePaymentApi.getParentPayments(),
  });
}

/**
 * Admin hooks - for fee management
 */
export function useFeeStructures() {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_STRUCTURES],
    queryFn: () => feeStructureApi.getAll(),
  });
}

export function useFeeStructureDetail(id: string) {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_STRUCTURE_DETAIL, id],
    queryFn: () => feeStructureApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentFees(filters?: StudentFeeFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.STUDENT_FEES, filters],
    queryFn: () => studentFeeApi.getAll(filters),
  });
}

export function useStudentFeeDetail(id: string) {
  return useQuery({
    queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, id],
    queryFn: () => studentFeeApi.getById(id),
    enabled: !!id,
  });
}

export function useFeePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENTS, filters],
    queryFn: () => feePaymentApi.getAll(filters),
  });
}

export function useRecentPayments(params?: { page_size?: number }) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENTS, 'recent', params],
    queryFn: () => feePaymentApi.getAll(params),
  });
}

export function useFeeDashboard() {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_DASHBOARD],
    queryFn: () => feeDashboardApi.get(),
  });
}

// ============== MUTATIONS ==============

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeeStructurePayload) => feeStructureApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_STRUCTURES] });
      showToast('success', FeeMessages.FEE_STRUCTURE_CREATED);
    },
    onError: (error: Error) => {
      showToast('error', error.message || 'Failed to create fee structure');
    },
  });
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeeStructurePayload }) =>
      feeStructureApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_STRUCTURES] });
      showToast('success', FeeMessages.FEE_STRUCTURE_UPDATED);
    },
    onError: (error: Error) => {
      showToast('error', error.message || 'Failed to update fee structure');
    },
  });
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feeStructureApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_STRUCTURES] });
      showToast('success', FeeMessages.FEE_STRUCTURE_DELETED);
    },
    onError: (error: Error) => {
      showToast('error', error.message || 'Failed to delete fee structure');
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeePaymentPayload) => feePaymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.STUDENT_FEES] });
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.PAYMENTS] });
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_DASHBOARD] });
      showToast('success', FeeMessages.PAYMENT_RECORDED);
    },
    onError: (error: Error) => {
      showToast('error', error.message || 'Failed to record payment');
    },
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeeReminderPayload) => feeReminderApi.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.REMINDERS] });
      showToast('success', FeeMessages.REMINDER_SENT);
    },
    onError: (error: Error) => {
      showToast('error', error.message || 'Failed to send reminder');
    },
  });
}
