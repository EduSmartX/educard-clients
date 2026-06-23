/**
 * Calendar API — Working Day Navigation
 *
 * Reusable API for navigating working days across features
 * like homework, attendance, timetable, etc.
 */

import type {
  WorkingDayInfo,
  WorkingDayInfoParams,
  WorkingDayNavigationParams,
  WorkingDayNavigationResult,
} from '@educard/shared';

import { apiClient } from '@/api/client';

const BASE_URL = '/core/calendar';

interface DetailResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============== API Functions ==============

/**
 * Navigate to the previous or next working day from a given date.
 *
 * @param params - Navigation parameters
 * @returns The next/previous working day info
 */
export async function navigateWorkingDay(
  params: WorkingDayNavigationParams
): Promise<WorkingDayNavigationResult> {
  const res = await apiClient.get<DetailResponse<WorkingDayNavigationResult>>(
    `${BASE_URL}/working-day/navigate/`,
    { params }
  );
  return res.data.data;
}

/**
 * Check if a specific date is a working day.
 *
 * @param params - Date check parameters
 * @returns Working day status and reason
 */
export async function getWorkingDayInfo(params: WorkingDayInfoParams): Promise<WorkingDayInfo> {
  const res = await apiClient.get<DetailResponse<WorkingDayInfo>>(`${BASE_URL}/working-day/info/`, {
    params,
  });
  return res.data.data;
}

// Re-export types for consumers
export type {
  WorkingDayInfo,
  WorkingDayInfoParams,
  WorkingDayNavigationParams,
  WorkingDayNavigationResult,
} from '@educard/shared';
