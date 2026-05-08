/**
 * Class Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { fetchClasses, fetchClass } from '../api/classes-api';
import type { FetchClassesParams } from '../types';

export function useClasses(params: FetchClassesParams = {}) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => fetchClasses(params),
    staleTime: 30 * 1000, // 30 seconds — ensures fresh data on navigation
  });
}

export function useClass(publicId: string | undefined, isDeleted = false) {
  return useQuery({
    queryKey: ['classes', publicId, isDeleted],
    queryFn: () => fetchClass(publicId!, isDeleted),
    enabled: !!publicId,
    staleTime: 0, // Always refetch detail to pick up cross-device changes
  });
}
