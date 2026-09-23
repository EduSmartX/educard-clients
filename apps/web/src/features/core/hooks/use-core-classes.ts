/**
 * Core Classes Hooks
 * React Query hooks for core classes (master data)
 */

import { useQuery } from '@tanstack/react-query';
import { fetchCoreClasses } from '../api/core-classes-api';

export function useCoreClasses() {
  return useQuery({
    queryKey: ['core', 'classes'],
    queryFn: fetchCoreClasses,
    staleTime: 1000 * 60 * 60, // 1 hour - core data rarely changes
  });
}
