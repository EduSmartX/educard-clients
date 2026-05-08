/**
 * Exam Mutations
 * All mutation hooks for exams module
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  handleMutationError,
  type FieldErrors,
  type MutationOptions,
} from '@/lib/utils/mutation-utils';
import {
  createExamSession,
  updateExamSession,
  deleteExamSession,
  reactivateExamSession,
  bulkUpdateExamStatusBySession,
  createExam,
  updateExam,
  deleteExam,
  reactivateExam,
} from '../api/exams-api';
import { ErrorMessages, SuccessMessages } from '@/constants';
import type {
  ExamSessionCreatePayload,
  ExamSessionUpdatePayload,
  ExamCreatePayload,
  ExamUpdatePayload,
  ExamStatus,
} from '../types';

export type { MutationOptions };

// Exam Session Mutations

export function useCreateExamSession(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamSessionCreatePayload) => createExamSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(SuccessMessages.EXAM_SESSION.CREATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM_SESSION.CREATE_FAILED, options?.onError);
    },
  });
}

export function useUpdateExamSession(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExamSessionUpdatePayload }) =>
      updateExamSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(SuccessMessages.EXAM_SESSION.UPDATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM_SESSION.UPDATE_FAILED, options?.onError);
    },
  });
}

export function useDeleteExamSession(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExamSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(SuccessMessages.EXAM_SESSION.DELETE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM_SESSION.DELETE_FAILED, options?.onError);
    },
  });
}

export function useReactivateExamSession(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateExamSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(SuccessMessages.EXAM_SESSION.REACTIVATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM_SESSION.REACTIVATE_FAILED, options?.onError);
    },
  });
}

// Exam Mutations

export function useCreateExam(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamCreatePayload) => createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(SuccessMessages.EXAM.CREATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM.CREATE_FAILED, options?.onError);
    },
  });
}

export function useUpdateExam(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExamUpdatePayload }) => updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success(SuccessMessages.EXAM.UPDATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM.UPDATE_FAILED, options?.onError);
    },
  });
}

export function useDeleteExam(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(SuccessMessages.EXAM.DELETE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM.DELETE_FAILED, options?.onError);
    },
  });
}

export function useReactivateExam(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success(SuccessMessages.EXAM.REACTIVATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.EXAM.REACTIVATE_FAILED, options?.onError);
    },
  });
}

// Status Update Mutations

export function useUpdateExamStatus(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExamStatus }) =>
      updateExam(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam status updated successfully');
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, 'Failed to update exam status', options?.onError);
    },
  });
}

export function useBulkUpdateExamStatusBySession(options?: MutationOptions<FieldErrors>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      bulkUpdateExamStatusBySession(sessionId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-sessions'] });
      toast.success(`Successfully updated ${data.updated_count} exam(s)`);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, 'Failed to bulk update exam statuses', options?.onError);
    },
  });
}
