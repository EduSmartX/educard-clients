/**
 * Calendar Hooks
 * React Query hooks for working day navigation
 * Uses shared hook factories with web-specific API implementation
 */

import {
  createUseNavigateWorkingDay,
  createUseWorkingDayInfo,
} from '@educard/shared';

import { navigateWorkingDay, getWorkingDayInfo } from '../api/calendar-api';

// Create hooks using shared factories with web API functions
export const useNavigateWorkingDay = createUseNavigateWorkingDay(navigateWorkingDay);
export const useWorkingDayInfo = createUseWorkingDayInfo(getWorkingDayInfo);

// Re-export query keys and types
export { calendarKeys } from '@educard/shared';
export type {
  WorkingDayInfo,
  WorkingDayNavigationResult,
  WorkingDayNavigationParams,
  WorkingDayInfoParams,
} from '@educard/shared';
