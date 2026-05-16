/**
 * Calendar API — Working Day Navigation
 *
 * Reusable API for navigating working days across features
 * like homework, attendance, timetable, etc.
 */

import { apiClient } from '@/api/client';

const BASE_URL = '/core/calendar';

interface DetailResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============== Types ==============

export interface WorkingDayInfo {
  date: string; // YYYY-MM-DD format
  is_working_day: boolean;
  day_type: 'working' | 'weekend' | 'holiday' | 'force_working' | 'force_holiday';
  reason: string;
}

export interface WorkingDayNavigationResult extends WorkingDayInfo {
  days_skipped: number;
}

export interface WorkingDayNavigationParams {
  date: string; // YYYY-MM-DD format
  direction: 'previous' | 'next';
  class_id?: string;
  for_teachers?: boolean;
}

export interface WorkingDayInfoParams {
  date: string; // YYYY-MM-DD format
  class_id?: string;
  for_teachers?: boolean;
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
