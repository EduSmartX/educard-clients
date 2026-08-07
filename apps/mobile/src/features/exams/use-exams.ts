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

import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { useCriticalOperation } from '@/providers/critical-operation-context';
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
  publishExamMarks,
  unpublishExamMarks,
  sendExamScheduleNotification,
  sendExamResultsNotification,
  sendExamProgressNotification,
} from './api';

export function useExamSessions(
  params?: Record<string, unknown>,
  userRole?: string | null,
) {
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

export function useExams(
  params?: Record<string, unknown>,
  userRole?: string | null,
) {
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

export function useMarksOverview(
  sessionId?: string,
  classId?: string,
  userRole?: string | null,
) {
  return useQuery({
    queryKey: ['marks-overview', sessionId, classId, userRole],
    queryFn: () =>
      fetchMarksOverview({
        session_id: sessionId ?? '',
        class_id: classId ?? '',
      }),
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

export function useBulkUpsertMarks(
  userRole?: string | null,
  options?: MutationOptions,
) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: Parameters<typeof bulkUpsertMarks>[0]) =>
      bulkUpsertMarks(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Saving marks',
        description: 'Saving marks for the class...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Marks saved successfully');
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      void qc.invalidateQueries({ queryKey: ['exams'] });
      void qc.invalidateQueries({ queryKey: ['exam'] });
      void qc.invalidateQueries({ queryKey: ['exam-marks'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save marks', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useBulkSaveAllMarks(
  userRole?: string | null,
  options?: MutationOptions,
) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: BulkSaveAllMarksPayload) => bulkSaveAllMarks(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Saving all marks',
        description: 'Saving marks across all subjects...',
      });
    },
    onSuccess: () => {
      showToast('success', 'All marks saved successfully');
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      void qc.invalidateQueries({ queryKey: ['exams'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save marks', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
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
      handleMutationError(
        error,
        'Failed to create exam session',
        options?.onError,
      );
    },
  });
}

export function useUpdateExamSession(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ExamSessionCreatePayload>;
    }) => updateExamSession(id, data),
    onSuccess: () => {
      showToast('success', 'Exam session updated successfully');
      void qc.invalidateQueries({ queryKey: ['exam-sessions'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to update exam session',
        options?.onError,
      );
    },
  });
}

export function useDeleteExamSession(options?: MutationOptions) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (id: string) => deleteExamSession(id),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting exam session',
        description: 'Removing the session and its related exams...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Exam session deleted successfully');
      void qc.invalidateQueries({ queryKey: ['exam-sessions'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to delete exam session',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
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

export function useUpdateExam(
  userRole?: string | null,
  options?: MutationOptions,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ExamCreatePayload>;
    }) => updateExam(id, data, userRole),
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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (id: string) => deleteExam(id),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting exam',
        description: 'Removing the exam and its related marks...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Exam deleted successfully');
      void qc.invalidateQueries({ queryKey: ['exams'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete exam', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

// ─── Marks Publishing ───────────────────────────────────────────────────────────

export function usePublishExamMarks(options?: MutationOptions) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (examId: string) => publishExamMarks(examId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Publishing marks',
        description: 'Publishing marks for the class...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Marks published successfully');
      void qc.invalidateQueries({ queryKey: ['exams'] });
      // single-exam detail drives the publish/unpublish toggle
      void qc.invalidateQueries({ queryKey: ['exam'] });
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to publish marks', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUnpublishExamMarks(options?: MutationOptions) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (examId: string) => unpublishExamMarks(examId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Unpublishing marks',
        description: 'Unpublishing marks for the class...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Marks unpublished successfully');
      void qc.invalidateQueries({ queryKey: ['exams'] });
      // single-exam detail drives the publish/unpublish toggle
      void qc.invalidateQueries({ queryKey: ['exam'] });
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to unpublish marks', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

// ─── Exam Notifications ─────────────────────────────────────────────────────────

export function useSendExamScheduleNotification(options?: MutationOptions) {
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      sessionId,
      classId,
    }: {
      sessionId: string;
      classId: string;
    }) => sendExamScheduleNotification(sessionId, classId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Sending notification',
        description: 'Notifying the class about the exam schedule...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Schedule notification sent successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to send schedule notification',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useSendExamResultsNotification(options?: MutationOptions) {
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      sessionId,
      classId,
    }: {
      sessionId: string;
      classId: string;
    }) => sendExamResultsNotification(sessionId, classId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Sending notification',
        description: 'Notifying parents about the exam results...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Results notification sent successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to send results notification',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useSendExamProgressNotification(options?: MutationOptions) {
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      sessionId,
      classId,
    }: {
      sessionId: string;
      classId: string;
    }) => sendExamProgressNotification(sessionId, classId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Sending notification',
        description: 'Sending progress reports to parents...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Progress report notification sent successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to send progress notification',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}
