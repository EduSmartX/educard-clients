/**
 * Calendar React Query Hooks
 *
 * Uses shared hook factories with mobile-specific API implementation
 */

import {
  calendarKeys,
  createUseNavigateWorkingDay,
  createUseWorkingDayInfo,
} from '@educard/shared';

import { navigateWorkingDay, getWorkingDayInfo } from './api';

// Create hooks using shared factories with mobile API functions
export const useNavigateWorkingDay = createUseNavigateWorkingDay(navigateWorkingDay);
export const useWorkingDayInfo = createUseWorkingDayInfo(getWorkingDayInfo);

// Re-export query keys and types
export { calendarKeys };
export type {
  WorkingDayInfo,
  WorkingDayNavigationResult,
  WorkingDayNavigationParams,
  WorkingDayInfoParams,
} from '@educard/shared';
