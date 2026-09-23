/**
 * Class Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { fetchClasses, fetchClass } from '../api/classes-api';
import type { FetchClassesParams } from '../types';

export function useClasses(params: FetchClassesParams = {}) {
  return useQuery({
    queryKey: QueryKeys.CLASSES.LIST(params),
    queryFn: () => fetchClasses(params),
    staleTime: 30 * 1000,
  });
}

export function useClass(publicId: string | undefined, isDeleted = false) {
  return useQuery({
    queryKey: QueryKeys.CLASSES.DETAIL(publicId ?? ''),
    queryFn: () => fetchClass(publicId!, isDeleted),
    enabled: !!publicId,
    staleTime: 0,
  });
}
