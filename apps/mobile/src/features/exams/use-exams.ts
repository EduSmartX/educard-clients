/**
 * Exam React Query hooks
 * Role-aware hooks that use the correct API endpoints based on user role
 */

import type {
  ExamSessionCreatePayload,
  ExamCreatePayload,
  BulkSaveAllMarksPayload,
} from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { handleMutationError, type MutationOptions } from '@/lib/mutation-utils';
import { showToast } from '@/utils/toast';

import {
  fetchExamSessions,
  fetchExamSession,
  fetchExams,
  fetchExam,
  fetchMarksOverview,
  fetchExamMarks,
  bulkUpsertMarks,
  bulkSaveAllMarks,
  createExamSession,
  updateExamSession,
  deleteExamSession,
  createExam,
  updateExam,
  deleteExam,
} from './api';

export function useExamSessions(params?: Record<string, unknown>, userRole?: string | null) {
  return useQuery({
    queryKey: ['exam-sessions', params, userRole],
    queryFn: () => fetchExamSessions(params, userRole),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExamSession(id?: string, userRole?: string | null) {
  return useQuery({
    queryKey: ['exam-session', id, userRole],
    queryFn: () => fetchExamSession(id ?? '', userRole),
    enabled: !!id,
  });
}

export function useExams(params?: Record<string, unknown>, userRole?: string | null) {
  return useQuery({
    queryKey: ['exams', params, userRole],
    queryFn: () => fetchExams(params, userRole),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExam(id?: string, userRole?: string | null) {
  return useQuery({
    queryKey: ['exam', id, userRole],
    queryFn: () => fetchExam(id ?? '', userRole),
    enabled: !!id,
  });
}

export function useMarksOverview(sessionId?: string, classId?: string, userRole?: string | null) {
  return useQuery({
    queryKey: ['marks-overview', sessionId, classId, userRole],
    queryFn: () =>
      fetchMarksOverview({ session_id: sessionId ?? '', class_id: classId ?? '' }, userRole),
    enabled: !!sessionId && !!classId,
  });
}

export function useExamMarks(examId?: string) {
  return useQuery({
    queryKey: ['exam-marks', examId],
    queryFn: () => fetchExamMarks(examId ?? ''),
    enabled: !!examId,
  });
}

export function useBulkUpsertMarks(userRole?: string | null, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof bulkUpsertMarks>[0]) => bulkUpsertMarks(data, userRole),
    onSuccess: () => {
      showToast('success', 'Marks saved successfully');
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      void qc.invalidateQueries({ queryKey: ['exams'] });
      void qc.invalidateQueries({ queryKey: ['exam-marks'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save marks', options?.onError);
    },
  });
}

export function useBulkSaveAllMarks(userRole?: string | null, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSaveAllMarksPayload) => bulkSaveAllMarks(data, userRole),
    onSuccess: () => {
      showToast('success', 'All marks saved successfully');
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      void qc.invalidateQueries({ queryKey: ['exams'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save marks', options?.onError);
    },
  });
}

// Session mutations
export function useCreateExamSession(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamSessionCreatePayload) => createExamSession(data),
    onSuccess: () => {
      showToast('success', 'Exam session created successfully');
      void qc.invalidateQueries({ queryKey: ['exam-sessions'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create exam session', options?.onError);
    },
  });
}

export function useUpdateExamSession(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamSessionCreatePayload> }) =>
      updateExamSession(id, data),
    onSuccess: () => {
      showToast('success', 'Exam session updated successfully');
      void qc.invalidateQueries({ queryKey: ['exam-sessions'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update exam session', options?.onError);
    },
  });
}

export function useDeleteExamSession(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExamSession(id),
    onSuccess: () => {
      showToast('success', 'Exam session deleted successfully');
      void qc.invalidateQueries({ queryKey: ['exam-sessions'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete exam session', options?.onError);
    },
  });
}

// Exam mutations
export function useCreateExam(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamCreatePayload) => createExam(data),
    onSuccess: () => {
      showToast('success', 'Exam created successfully');
      void qc.invalidateQueries({ queryKey: ['exams'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create exam', options?.onError);
    },
  });
}

export function useUpdateExam(userRole?: string | null, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamCreatePayload> }) =>
      updateExam(id, data, userRole),
    onSuccess: () => {
      showToast('success', 'Exam updated successfully');
      void qc.invalidateQueries({ queryKey: ['exams'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update exam', options?.onError);
    },
  });
}

export function useDeleteExam(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExam(id),
    onSuccess: () => {
      showToast('success', 'Exam deleted successfully');
      void qc.invalidateQueries({ queryKey: ['exams'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete exam', options?.onError);
    },
  });
}
