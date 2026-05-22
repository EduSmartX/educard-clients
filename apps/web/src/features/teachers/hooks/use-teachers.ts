/**
 * Teacher Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { fetchTeachers, fetchTeacher } from '../api/teachers-api';
import type { FetchTeachersParams } from '../types';

export function useTeachers(params: FetchTeachersParams = {}) {
  return useQuery({
    queryKey: QueryKeys.TEACHERS.LIST(params as Record<string, unknown>),
    queryFn: () => fetchTeachers(params),
    staleTime: 30 * 1000,
  });
}

export function useTeacher(publicId: string | undefined, isDeleted?: boolean) {
  return useQuery({
    queryKey: QueryKeys.TEACHERS.DETAIL(publicId ?? ''),
    queryFn: () => {
      if (!publicId) {
        throw new Error('Teacher ID is required');
      }
      return fetchTeacher(publicId, isDeleted);
    },
    enabled: !!publicId,
    retry: 1,
    staleTime: 30 * 1000,
  });
}
