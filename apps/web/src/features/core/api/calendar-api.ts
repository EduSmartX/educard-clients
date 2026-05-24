/**
 * Calendar API — Working Day Navigation
 *
 * Reusable API for navigating working days across features
 * like homework, attendance, timetable, etc.
 */

import api from '@/lib/api';

import type {
  WorkingDayInfo,
  WorkingDayInfoParams,
  WorkingDayNavigationParams,
  WorkingDayNavigationResult,
} from '@educard/shared';

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
 *
 * @example
 * // Get next working day
 * const nextDay = await navigateWorkingDay({
 *   date: '2026-05-16',
 *   direction: 'next',
 *   class_id: 'class_abc123'
 * });
 *
 * @example
 * // Get previous working day for teachers
 * const prevDay = await navigateWorkingDay({
 *   date: '2026-05-16',
 *   direction: 'previous',
 *   for_teachers: true
 * });
 */
export async function navigateWorkingDay(
  params: WorkingDayNavigationParams
): Promise<WorkingDayNavigationResult> {
  const response = await api.get<DetailResponse<WorkingDayNavigationResult>>(
    `${BASE_URL}/working-day/navigate/`,
    { params }
  );
  return response.data.data;
}

/**
 * Check if a specific date is a working day.
 *
 * @param params - Date check parameters
 * @returns Working day status and reason
 *
 * @example
 * const info = await getWorkingDayInfo({ date: '2026-05-16' });
 * if (!info.is_working_day) {
 *   console.log(`Not a working day: ${info.reason}`);
 * }
 */
export async function getWorkingDayInfo(params: WorkingDayInfoParams): Promise<WorkingDayInfo> {
  const response = await api.get<DetailResponse<WorkingDayInfo>>(`${BASE_URL}/working-day/info/`, {
    params,
  });
  return response.data.data;
}

// Re-export types for consumers
export type {
  WorkingDayInfo,
  WorkingDayInfoParams,
  WorkingDayNavigationParams,
  WorkingDayNavigationResult,
} from '@educard/shared';
