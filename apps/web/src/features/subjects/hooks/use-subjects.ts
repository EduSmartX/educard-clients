/**
 * React Query hooks for subjects
 */

import { useQuery } from '@tanstack/react-query';
import { fetchSubjects, fetchSubject } from '../api/subjects-api';
import type { SubjectListParams } from '../types/subject';

/**
 * Hook to fetch list of subjects
 */
export function useSubjects(params?: SubjectListParams) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () => fetchSubjects(params),
  });
}

/**
 * Hook to fetch single subject
 */
export function useSubject(publicId?: string, isDeleted = false) {
  return useQuery({
    queryKey: ['subject', publicId, isDeleted],
    queryFn: () => fetchSubject(publicId!, isDeleted),
    enabled: !!publicId,
  });
}
