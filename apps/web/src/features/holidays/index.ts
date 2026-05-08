/**
 * Holidays Feature - Main Export
 * Organization Holiday Calendar feature
 */

// Main component
export { HolidayCalendar } from './components/holiday-calendar';

// Sub-components
export {
  CalendarView,
  TableView,
  HolidayFormDialog,
  BulkUploadDialog,
  DateActionDialog,
} from './components';

// API functions
export * from './api/holidays-api';

// Types
export type * from './types';

// Hooks - Mutations
export {
  useCreateHoliday,
  useCreateHolidaysBulk,
  useUpdateHoliday,
  useDeleteHoliday,
  useBulkUploadHolidays,
  type MutationOptions,
} from './hooks/mutations';

// Utilities
export * from './utils/holiday-utils';
