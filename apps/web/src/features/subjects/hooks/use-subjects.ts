/**
 * Subject Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { fetchSubjects, fetchSubject } from '../api/subjects-api';
import type { SubjectListParams } from '../types/subject';

export function useSubjects(params?: SubjectListParams) {
  return useQuery({
    queryKey: QueryKeys.SUBJECTS.LIST(params),
    queryFn: () => fetchSubjects(params),
  });
}

export function useSubject(publicId?: string, isDeleted = false) {
  return useQuery({
    queryKey: QueryKeys.SUBJECTS.DETAIL(publicId ?? ''),
    queryFn: () => fetchSubject(publicId!, isDeleted),
    enabled: !!publicId,
  });
}
