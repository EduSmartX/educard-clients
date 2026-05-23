/**
 * Fee Hooks — Admin (Mobile)
 * React Query hooks for all fee management operations
 */

import { QueryKeys, FeeMessages } from '@educard/shared';
import type {
  FeeStructureCreatePayload,
  FeeStructureUpdatePayload,
  FeeStructureFilters,
  StudentFeeCreatePayload,
  StudentFeeUpdatePayload,
  StudentFeeComponentUpdatePayload,
  ComponentReviewPayload,
  StudentFeeFilters,
  PaymentCreatePayload,
  PaymentFilters,
  SendReminderPayload,
  BulkReminderPayload,
} from '@educard/shared';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/utils/toast';

import {
  fetchFeeStructures,
  fetchFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  fetchStudentFees,
  fetchStudentFee,
  createStudentFee,
  updateStudentFee,
  deleteStudentFee,
  updateStudentFeeComponents,
  reviewComponentRequests,
  fetchPayments,
  recordPayment,
  fetchFeeDashboard,
  fetchDefaulters,
  sendFeeReminder,
  sendBulkFeeReminder,
  fetchEligibleStudents,
} from './api';

// ─── Fee Structures ───────────────────────────────────────────────────────────

export function useFeeStructures(params?: FeeStructureFilters) {
  return useInfiniteQuery({
    queryKey: QueryKeys.FEE.STRUCTURES.INFINITE(params as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) => fetchFeeStructures({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.current_page + 1 : undefined,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages.at(-1)?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useFeeStructure(id: string) {
  return useQuery({
    queryKey: QueryKeys.FEE.STRUCTURES.DETAIL(id),
    queryFn: () => fetchFeeStructure(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FeeStructureCreatePayload) => createFeeStructure(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.ALL });
      showToast('success', FeeMessages.FEE_STRUCTURE_CREATED);
    },
  });
}

export function useUpdateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeeStructureUpdatePayload }) =>
      updateFeeStructure(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.DETAIL(id) });
      showToast('success', FeeMessages.FEE_STRUCTURE_UPDATED);
    },
  });
}

export function useDeleteFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFeeStructure(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.ALL });
      showToast('success', FeeMessages.FEE_STRUCTURE_DELETED);
    },
  });
}

// ─── Student Fees ─────────────────────────────────────────────────────────────

export function useStudentFees(params?: StudentFeeFilters) {
  return useInfiniteQuery({
    queryKey: QueryKeys.FEE.STUDENT_FEES.INFINITE(params as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) => fetchStudentFees({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.current_page + 1 : undefined,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages.at(-1)?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useStudentFee(id: string) {
  return useQuery({
    queryKey: QueryKeys.FEE.STUDENT_FEES.DETAIL(id),
    queryFn: () => fetchStudentFee(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateStudentFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StudentFeeCreatePayload) => createStudentFee(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      showToast('success', FeeMessages.STUDENT_FEE_CREATED);
    },
  });
}

export function useUpdateStudentFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFeeUpdatePayload }) =>
      updateStudentFee(id, data),
    onSuccess: (updatedFee, { id }) => {
      // Set cache directly from PATCH response — avoids redundant GET call
      qc.setQueryData(QueryKeys.FEE.STUDENT_FEES.DETAIL(id), updatedFee);
      // Invalidate list queries so they reflect updated data on next visit
      void qc.invalidateQueries({
        queryKey: ['fee', 'student-fees', 'infinite'],
      });
      showToast('success', FeeMessages.STUDENT_FEE_UPDATED);
    },
  });
}

export function useDeleteStudentFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudentFee(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      showToast('success', FeeMessages.STUDENT_FEE_DELETED);
    },
  });
}

export function useUpdateStudentFeeComponents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFeeComponentUpdatePayload }) =>
      updateStudentFeeComponents(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.DETAIL(id) });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.DASHBOARD });
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update components');
    },
  });
}

export function useReviewComponentRequests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComponentReviewPayload }) =>
      reviewComponentRequests(id, data),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.DETAIL(id) });
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to review requests');
    },
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function usePayments(params?: PaymentFilters) {
  return useInfiniteQuery({
    queryKey: QueryKeys.FEE.PAYMENTS.INFINITE(params as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) => fetchPayments({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.current_page + 1 : undefined,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages.at(-1)?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentCreatePayload) => recordPayment(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.PAYMENTS.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.DASHBOARD });
      showToast('success', FeeMessages.PAYMENT_RECORDED);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to record payment');
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useFeeDashboard() {
  return useQuery({
    queryKey: QueryKeys.FEE.DASHBOARD,
    queryFn: fetchFeeDashboard,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDefaulters(paidPercentageLt?: number) {
  return useQuery({
    queryKey: QueryKeys.FEE.DEFAULTERS({ paid_percentage_lt: paidPercentageLt }),
    queryFn: () => fetchDefaulters(paidPercentageLt),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function useSendFeeReminder() {
  return useMutation({
    mutationFn: (data: SendReminderPayload) => sendFeeReminder(data),
    onSuccess: () => {
      showToast('success', FeeMessages.REMINDER_SENT);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to send reminder');
    },
  });
}

export function useSendBulkFeeReminder() {
  return useMutation({
    mutationFn: (data: BulkReminderPayload) => sendBulkFeeReminder(data),
    onSuccess: () => {
      showToast('success', FeeMessages.BULK_REMINDER_SENT);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to send bulk reminders');
    },
  });
}

// ─── Eligible Students (lightweight) ──────────────────────────────────────────

export function useEligibleStudents(classId: string) {
  return useQuery({
    queryKey: [...QueryKeys.FEE.STUDENT_FEES.ALL, 'eligible-students', classId],
    queryFn: () => fetchEligibleStudents({ class_id: classId }),
    enabled: !!classId,
    staleTime: 60 * 1000,
  });
}
