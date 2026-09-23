/**
 * Core Subjects Query Hook
 * React Query hook for fetching master/core subjects
 */

import { useQuery } from '@tanstack/react-query';
import { fetchCoreSubjects } from '../api/core-subjects-api';

export function useCoreSubjects() {
  return useQuery({
    queryKey: ['core', 'subjects'],
    queryFn: fetchCoreSubjects,
    staleTime: 10 * 60 * 1000, // 10 minutes - core subjects rarely change
  });
}
