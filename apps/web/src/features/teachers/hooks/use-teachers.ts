/**
 * Teacher Query Hooks
 * React Query hooks for fetching teacher data
 */

import { useQuery } from '@tanstack/react-query';
import { fetchTeachers, fetchTeacher } from '../api/teachers-api';
import type { FetchTeachersParams } from '../types';

/**
 * Hook to fetch teachers list with pagination and filters
 * @param params - Query parameters for filtering/pagination
 */
export function useTeachers(params: FetchTeachersParams = {}) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => fetchTeachers(params),
    staleTime: 30 * 1000, // 30 seconds — ensures fresh data on navigation
  });
}

/**
 * Hook to fetch a single teacher
 * @param publicId - Teacher public ID
 * @param isDeleted - Whether to fetch deleted teacher
 */
export function useTeacher(publicId: string | undefined, isDeleted?: boolean) {
  return useQuery({
    queryKey: ['teachers', publicId, isDeleted],
    queryFn: () => {
      if (!publicId) {
        throw new Error('Teacher ID is required');
      }
      return fetchTeacher(publicId, isDeleted);
    },
    enabled: !!publicId,
    retry: 1, // Only retry once
    staleTime: 30 * 1000, // 30 seconds
  });
}
