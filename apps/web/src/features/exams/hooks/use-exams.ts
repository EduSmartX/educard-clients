/**
 * React Query hooks for exams
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchExamSessions,
  fetchExamSession,
  fetchExams,
  fetchExam,
  fetchMarksOverview,
  type MarksOverviewParams,
} from '../api/exams-api';
import type { ExamSessionListParams, ExamListParams } from '../types';

// Exam Sessions

export function useExamSessions(params?: ExamSessionListParams) {
  return useQuery({
    queryKey: ['exam-sessions', params],
    queryFn: () => fetchExamSessions(params),
  });
}

export function useExamSession(publicId?: string) {
  return useQuery({
    queryKey: ['exam-session', publicId],
    queryFn: () => fetchExamSession(publicId!),
    enabled: !!publicId,
  });
}

// Exams (Subject + Session combination)

export function useExams(params?: ExamListParams) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => fetchExams(params),
  });
}

export function useExam(publicId?: string) {
  return useQuery({
    queryKey: ['exam', publicId],
    queryFn: () => fetchExam(publicId!),
    enabled: !!publicId,
  });
}

// Marks Overview
export function useMarksOverview(params: MarksOverviewParams | null) {
  return useQuery({
    queryKey: ['marks-overview', params],
    queryFn: () => fetchMarksOverview(params!),
    enabled: !!params?.session_id && !!params?.class_id,
  });
}
