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
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { useCriticalOperation } from '@/providers/critical-operation-context';
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
    queryKey: QueryKeys.FEE.STRUCTURES.INFINITE(params),
    queryFn: ({ pageParam = 1 }) =>
      fetchFeeStructures({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.has_next
        ? lastPage.pagination.current_page + 1
        : undefined,
    select: data => ({
      items: data.pages.flatMap(p => p.data),
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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: FeeStructureCreatePayload) => createFeeStructure(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Creating fee structure',
        description: 'Generating fee records for all applicable students...',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.ALL });
      showToast('success', FeeMessages.FEE_STRUCTURE_CREATED);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUpdateFeeStructure() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FeeStructureUpdatePayload;
    }) => updateFeeStructure(id, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Updating fee structure',
        description: 'Recalculating fee records for affected students...',
      });
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.ALL });
      void qc.invalidateQueries({
        queryKey: QueryKeys.FEE.STRUCTURES.DETAIL(id),
      });
      showToast('success', FeeMessages.FEE_STRUCTURE_UPDATED);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useDeleteFeeStructure() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (id: string) => deleteFeeStructure(id),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting fee structure',
        description: 'Removing the fee structure and related records...',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STRUCTURES.ALL });
      showToast('success', FeeMessages.FEE_STRUCTURE_DELETED);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

// ─── Student Fees ─────────────────────────────────────────────────────────────

export function useStudentFees(params?: StudentFeeFilters) {
  return useInfiniteQuery({
    queryKey: QueryKeys.FEE.STUDENT_FEES.INFINITE(params),
    queryFn: ({ pageParam = 1 }) =>
      fetchStudentFees({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.has_next
        ? lastPage.pagination.current_page + 1
        : undefined,
    select: data => ({
      items: data.pages.flatMap(p => p.data),
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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: StudentFeeCreatePayload) => createStudentFee(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Assigning fee',
        description: 'Generating fee components for the selected student...',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      showToast('success', FeeMessages.STUDENT_FEE_CREATED);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUpdateStudentFee() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFeeUpdatePayload }) =>
      updateStudentFee(id, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Updating fee',
        description: 'Recalculating balances for this student fee...',
      });
    },
    onSuccess: (updatedFee, { id }) => {
      // Set cache directly from PATCH response — avoids redundant GET call
      qc.setQueryData(QueryKeys.FEE.STUDENT_FEES.DETAIL(id), updatedFee);
      // Invalidate list queries so they reflect updated data on next visit
      void qc.invalidateQueries({
        queryKey: ['fee', 'student-fees', 'infinite'],
      });
      showToast('success', FeeMessages.STUDENT_FEE_UPDATED);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useDeleteStudentFee() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (id: string) => deleteStudentFee(id),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting fee',
        description: 'Removing the student fee and related records...',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      showToast('success', FeeMessages.STUDENT_FEE_DELETED);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUpdateStudentFeeComponents() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: StudentFeeComponentUpdatePayload;
    }) => updateStudentFeeComponents(id, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Updating fee components',
        description: 'Recalculating fee totals and balances...',
      });
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({
        queryKey: QueryKeys.FEE.STUDENT_FEES.DETAIL(id),
      });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.DASHBOARD });
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update components');
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useReviewComponentRequests() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComponentReviewPayload }) =>
      reviewComponentRequests(id, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Submitting review',
        description: 'Applying component changes and recalculating fees...',
      });
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({
        queryKey: QueryKeys.FEE.STUDENT_FEES.DETAIL(id),
      });
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to review requests');
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function usePayments(params?: PaymentFilters) {
  return useInfiniteQuery({
    queryKey: QueryKeys.FEE.PAYMENTS.INFINITE(params),
    queryFn: ({ pageParam = 1 }) =>
      fetchPayments({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.has_next
        ? lastPage.pagination.current_page + 1
        : undefined,
    select: data => ({
      items: data.pages.flatMap(p => p.data),
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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: PaymentCreatePayload) => recordPayment(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Recording payment',
        description: 'Updating fee balances and dashboard totals...',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.PAYMENTS.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.STUDENT_FEES.ALL });
      void qc.invalidateQueries({ queryKey: QueryKeys.FEE.DASHBOARD });
      showToast('success', FeeMessages.PAYMENT_RECORDED);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to record payment');
    },
    onSettled: () => {
      endCriticalOperation();
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
    queryKey: QueryKeys.FEE.DEFAULTERS({
      paid_percentage_lt: paidPercentageLt,
    }),
    queryFn: () => fetchDefaulters(paidPercentageLt),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export function useSendFeeReminder() {
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: SendReminderPayload) => sendFeeReminder(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Sending reminder',
        description: 'Please wait while the reminder is delivered...',
      });
    },
    onSuccess: () => {
      showToast('success', FeeMessages.REMINDER_SENT);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to send reminder');
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useSendBulkFeeReminder() {
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: BulkReminderPayload) => sendBulkFeeReminder(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Sending reminders',
        description: 'Delivering reminders to the selected parents...',
      });
    },
    onSuccess: () => {
      showToast('success', FeeMessages.BULK_REMINDER_SENT);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to send bulk reminders');
    },
    onSettled: () => {
      endCriticalOperation();
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
