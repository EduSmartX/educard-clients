/**
 * Exam React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchExamSessions,
  fetchExamSession,
  fetchExams,
  fetchExam,
  fetchMarksOverview,
  fetchExamMarks,
  bulkUpsertMarks,
  createExamSession,
  updateExamSession,
  deleteExamSession,
  createExam,
  updateExam,
  deleteExam,
} from './api';
import type { ExamSessionCreatePayload, ExamCreatePayload } from './types';

export function useExamSessions(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['exam-sessions', params],
    queryFn: () => fetchExamSessions(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExamSession(id?: string) {
  return useQuery({
    queryKey: ['exam-session', id],
    queryFn: () => fetchExamSession(id!),
    enabled: !!id,
  });
}

export function useExams(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => fetchExams(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExam(id?: string) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => fetchExam(id!),
    enabled: !!id,
  });
}

export function useMarksOverview(sessionId?: string, classId?: string) {
  return useQuery({
    queryKey: ['marks-overview', sessionId, classId],
    queryFn: () => fetchMarksOverview({ session_id: sessionId!, class_id: classId! }),
    enabled: !!sessionId && !!classId,
  });
}

export function useExamMarks(examId?: string) {
  return useQuery({
    queryKey: ['exam-marks', examId],
    queryFn: () => fetchExamMarks(examId!),
    enabled: !!examId,
  });
}

export function useBulkUpsertMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkUpsertMarks,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marks-overview'] });
      qc.invalidateQueries({ queryKey: ['exams'] });
      qc.invalidateQueries({ queryKey: ['exam-marks'] });
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
