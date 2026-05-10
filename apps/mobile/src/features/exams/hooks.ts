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

export function useBulkUpsertMarks(userRole?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof bulkUpsertMarks>[0]) => bulkUpsertMarks(data, userRole),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      void qc.invalidateQueries({ queryKey: ['exams'] });
      void qc.invalidateQueries({ queryKey: ['exam-marks'] });
    },
  });
}

export function useBulkSaveAllMarks(userRole?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSaveAllMarksPayload) => bulkSaveAllMarks(data, userRole),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['marks-overview'] });
      void qc.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

// Session mutations
export function useCreateExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamSessionCreatePayload) => createExamSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-sessions'] }),
  });
}

export function useUpdateExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamSessionCreatePayload> }) =>
      updateExamSession(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-sessions'] }),
  });
}

export function useDeleteExamSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExamSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-sessions'] }),
  });
}

// Exam mutations
export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExamCreatePayload) => createExam(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamCreatePayload> }) =>
      updateExam(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  });
}
