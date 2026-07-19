/**
 * Holiday Hooks
 * Centralized exports for all holiday-related hooks
 */

export {
  useCreateHoliday,
  useCreateHolidaysBulk,
  useUpdateHoliday,
  useDeleteHoliday,
  useBulkUploadHolidays,
  useSendHolidayNotification,
  type MutationOptions,
  type HolidayFieldErrors,
} from './mutations';
