/**
 * Fee Mutations - React Query hooks for fee operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createFeePaymentApi,
  createFeeReminderApi,
  createFeeStructureApi,
  createStudentFeeApi,
  ErrorMessages,
  FeeMessages,
  FeeQueryKeys,
  type BulkReminderPayload,
  type ComponentReviewPayload,
  type FeeStructureCreatePayload,
  type FeeStructureUpdatePayload,
  type PaymentCreatePayload,
  type SendReminderPayload,
  type StudentFeeCreatePayload,
  type StudentFeeUpdatePayload,
  type StudentFeeComponentUpdatePayload,
} from '@educard/shared';
import apiClient from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error-handler';

// Create API instances with the web's apiClient
const feeStructureApi = createFeeStructureApi(apiClient);
const studentFeeApi = createStudentFeeApi(apiClient);
const feePaymentApi = createFeePaymentApi(apiClient);
const feeReminderApi = createFeeReminderApi(apiClient);

// ============================================================================
// Fee Structure Mutations
// ============================================================================

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeeStructureCreatePayload) => feeStructureApi.create(data),
    onSuccess: () => {
      toast.success(FeeMessages.FEE_STRUCTURE_CREATED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_STRUCTURES],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.STRUCTURE_CREATE_FAILED));
    },
  });
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeeStructureUpdatePayload }) =>
      feeStructureApi.update(id, data),
    onSuccess: (_, variables) => {
      toast.success(FeeMessages.FEE_STRUCTURE_UPDATED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_STRUCTURES],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_STRUCTURE_DETAIL, variables.id],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.STRUCTURE_UPDATE_FAILED));
    },
  });
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feeStructureApi.delete(id),
    onSuccess: () => {
      toast.success(FeeMessages.FEE_STRUCTURE_DELETED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_STRUCTURES],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.STRUCTURE_DELETE_FAILED));
    },
  });
}

// ============================================================================
// Student Fee Mutations
// ============================================================================

export function useCreateStudentFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StudentFeeCreatePayload) => studentFeeApi.create(data),
    onSuccess: () => {
      toast.success(FeeMessages.STUDENT_FEE_CREATED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEES],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_DASHBOARD],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.STUDENT_FEE_CREATE_FAILED));
    },
  });
}

export function useUpdateStudentFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFeeUpdatePayload }) =>
      studentFeeApi.update(id, data),
    onSuccess: (_, variables) => {
      toast.success(FeeMessages.STUDENT_FEE_UPDATED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEES],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, variables.id],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.STUDENT_FEE_UPDATE_FAILED));
    },
  });
}

export function useUpdateStudentFeeComponents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFeeComponentUpdatePayload }) =>
      studentFeeApi.updateComponents(id, data),
    onSuccess: (_, variables) => {
      toast.success('Fee components updated successfully');
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEES],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, variables.id],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update fee components'));
    },
  });
}

export function useReviewComponentRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComponentReviewPayload }) =>
      studentFeeApi.reviewComponentRequests(id, data),
    onSuccess: (_, variables) => {
      toast.success('Component requests reviewed successfully');
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.STUDENT_FEES] });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, variables.id],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to review component requests'));
    },
  });
}

export function useMarkStudentFeeRefunded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentFeeApi.update(id, { status: 'refunded' }),
    onSuccess: (_, id) => {
      toast.success('Fee marked as Refunded successfully');
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.STUDENT_FEES] });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, id],
      });
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_DASHBOARD] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to mark fee as Refunded'));
    },
  });
}

export function useInitiateRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentFeeApi.update(id, { status: 'refunding' }),
    onSuccess: (_, id) => {
      toast.success('Refund initiated. Review and mark as Refunded when processed.');
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.STUDENT_FEES] });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, id],
      });
      queryClient.invalidateQueries({ queryKey: [FeeQueryKeys.FEE_DASHBOARD] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to initiate refund'));
    },
  });
}

export function useDeleteStudentFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentFeeApi.delete(id),
    onSuccess: () => {
      toast.success(FeeMessages.STUDENT_FEE_DELETED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEES],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_DASHBOARD],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.STUDENT_FEE_DELETE_FAILED));
    },
  });
}

// ============================================================================
// Payment Mutations
// ============================================================================

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentCreatePayload) => feePaymentApi.create(data),
    onSuccess: (_, variables) => {
      toast.success(FeeMessages.PAYMENT_RECORDED);
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.PAYMENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEES],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, variables.student_fee_public_id],
      });
      queryClient.invalidateQueries({
        queryKey: [FeeQueryKeys.FEE_DASHBOARD],
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.PAYMENT_CREATE_FAILED));
    },
  });
}

// ============================================================================
// Reminder Mutations
// ============================================================================

export function useSendReminder() {
  return useMutation({
    mutationFn: (data: SendReminderPayload) => feeReminderApi.send(data),
    onSuccess: () => {
      toast.success(FeeMessages.REMINDER_SENT);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.REMINDER_SEND_FAILED));
    },
  });
}

export function useSendBulkReminders() {
  return useMutation({
    mutationFn: (data: BulkReminderPayload) => feeReminderApi.sendBulk(data),
    onSuccess: () => {
      toast.success(FeeMessages.BULK_REMINDER_SENT);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ErrorMessages.FEE.BULK_REMINDER_FAILED));
    },
  });
}
