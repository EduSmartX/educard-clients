/**
 * Calendar Query Keys & Hooks
 * Shared across web and mobile for working day navigation
 */

import { useQuery, useMutation } from "@tanstack/react-query";

import type {
  WorkingDayInfo,
  WorkingDayInfoParams,
  WorkingDayNavigationParams,
  WorkingDayNavigationResult,
} from "../types/calendar";

// ============== Query Keys ==============

export const calendarKeys = {
  all: ["calendar"] as const,
  workingDay: () => [...calendarKeys.all, "working-day"] as const,
  workingDayInfo: (params: WorkingDayInfoParams) =>
    [...calendarKeys.workingDay(), "info", params] as const,
};

// ============== Hook Factories ==============

/**
 * Creates a useNavigateWorkingDay hook with the provided API function.
 * Each app passes its own API client implementation.
 */
export function createUseNavigateWorkingDay(
  navigateWorkingDayFn: (
    params: WorkingDayNavigationParams,
  ) => Promise<WorkingDayNavigationResult>,
) {
  return function useNavigateWorkingDay() {
    return useMutation<
      WorkingDayNavigationResult,
      Error,
      WorkingDayNavigationParams
    >({
      mutationFn: navigateWorkingDayFn,
    });
  };
}

/**
 * Creates a useWorkingDayInfo hook with the provided API function.
 * Each app passes its own API client implementation.
 */
export function createUseWorkingDayInfo(
  getWorkingDayInfoFn: (
    params: WorkingDayInfoParams,
  ) => Promise<WorkingDayInfo>,
) {
  return function useWorkingDayInfo(
    params: WorkingDayInfoParams,
    options?: { enabled?: boolean },
  ) {
    return useQuery<WorkingDayInfo, Error>({
      queryKey: calendarKeys.workingDayInfo(params),
      queryFn: () => getWorkingDayInfoFn(params),
      enabled: options?.enabled ?? true,
      staleTime: 5 * 60 * 1000, // 5 minutes - working day info doesn't change often
    });
  };
}

// Re-export types for convenience
export type {
  WorkingDayInfo,
  WorkingDayNavigationResult,
  WorkingDayNavigationParams,
  WorkingDayInfoParams,
};
