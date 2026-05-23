/**
 * Calendar React Query Hooks
 *
 * Provides hooks for working day navigation and info
 */

import { useQuery, useMutation } from '@tanstack/react-query';

import {
  navigateWorkingDay,
  getWorkingDayInfo,
  type WorkingDayNavigationParams,
  type WorkingDayInfoParams,
  type WorkingDayNavigationResult,
  type WorkingDayInfo,
} from './api';

// ============== Query Keys ==============

export const calendarKeys = {
  all: ['calendar'] as const,
  workingDay: () => [...calendarKeys.all, 'working-day'] as const,
  workingDayInfo: (params: WorkingDayInfoParams) =>
    [...calendarKeys.workingDay(), 'info', params] as const,
};

// ============== Hooks ==============

/**
 * Hook to navigate to previous/next working day.
 *
 * This is a mutation because it's typically triggered by user action (prev/next buttons)
 * and doesn't need caching of intermediate results.
 *
 */
export function useNavigateWorkingDay() {
  return useMutation<WorkingDayNavigationResult, Error, WorkingDayNavigationParams>({
    mutationFn: navigateWorkingDay,
  });
}

/**
 * Hook to check if a specific date is a working day.
 *
 * @param params - Date and optional class/teacher context
 * @param options - React Query options
 *
 */
export function useWorkingDayInfo(params: WorkingDayInfoParams, options?: { enabled?: boolean }) {
  return useQuery<WorkingDayInfo, Error>({
    queryKey: calendarKeys.workingDayInfo(params),
    queryFn: () => getWorkingDayInfo(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes - working day info doesn't change often
  });
}

// Re-export types for convenience
export type {
  WorkingDayInfo,
  WorkingDayNavigationResult,
  WorkingDayNavigationParams,
  WorkingDayInfoParams,
};
