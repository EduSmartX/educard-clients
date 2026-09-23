/**
 * useAppInfo — fetches company/support info (name, email, phone, user manual URL).
 * Public data; cached for a while since it rarely changes.
 */

import { useQuery } from '@tanstack/react-query';

import { fetchAppInfo } from '@/api/app-info';

export function useAppInfo() {
  return useQuery({
    queryKey: ['app-info'],
    queryFn: fetchAppInfo,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
