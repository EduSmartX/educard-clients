import { useQuery } from '@tanstack/react-query';
import { getStudentExamSessions, getExamSessionDetail } from './api';

export function useStudentExamSessions() {
  return useQuery({
    queryKey: ['student', 'exams', 'sessions'],
    queryFn: getStudentExamSessions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExamSessionDetail(publicId: string | null) {
  return useQuery({
    queryKey: ['student', 'exams', 'detail', publicId],
    queryFn: () => getExamSessionDetail(publicId!),
    enabled: !!publicId,
    staleTime: 5 * 60 * 1000,
  });
}
