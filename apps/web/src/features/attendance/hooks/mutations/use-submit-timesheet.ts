import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bulkSubmitEmployeeAttendance, returnTimesheetToDraft } from '@/features/attendance/api/attendance-api';
import { ErrorMessages, SuccessMessages } from '@/constants';

interface AttendanceRow {
  date: string;
  morning_present: boolean;
  afternoon_present: boolean;
  remarks: string;
}

interface SubmitTimesheetParams {
  records: AttendanceRow[];
  week_start_date: string;
  week_end_date: string;
}

interface SubmitTimesheetOptions {
  onSuccessCallback?: (data?: { message?: string }) => void;
  onErrorCallback?: (error: unknown) => void;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      errors?: {
        attendance_records?: Array<{
          date?: string[];
          [key: string]: unknown;
        }> | string[];
        timesheet_submission?: string[];
        [key: string]: unknown;
      };
    };
  };
}

export function useSubmitTimesheet(options?: SubmitTimesheetOptions) {
  const queryClient = useQueryClient();
  const { onSuccessCallback, onErrorCallback } = options || {};

  return useMutation({
    mutationFn: (payload: SubmitTimesheetParams) =>
      bulkSubmitEmployeeAttendance({
        attendance_records: payload.records,
        week_start_date: payload.week_start_date,
        week_end_date: payload.week_end_date,
        submit_timesheet: true,
      }),
    onSuccess: (data) => {
      const message = data?.message || SuccessMessages.ATTENDANCE.TIMESHEET_SUBMIT_SUCCESS;
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['timesheet-status'] });
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      onSuccessCallback?.(data);
    },
    onError: (error: unknown) => {
      const err = error as ApiErrorResponse;
      const errors = err?.response?.data?.errors;

      // Check for timesheet submission errors
      if (errors?.timesheet_submission && Array.isArray(errors.timesheet_submission)) {
        errors.timesheet_submission.forEach((msg) =>
          toast.error(msg, { duration: 5000 })
        );
        onErrorCallback?.(error);
        return;
      }

      // Check for attendance record validation errors
      if (errors?.attendance_records) {
        // Handle array of error messages directly (e.g., ["Cannot submit attendance for future date: 2026-03-10"])
        if (Array.isArray(errors.attendance_records) && errors.attendance_records.length > 0 && typeof errors.attendance_records[0] === 'string') {
          (errors.attendance_records as string[]).forEach((msg: string) => {
            toast.error(msg, { duration: 6000 });
          });
          onErrorCallback?.(error);
          return;
        }
        
        // Handle array of error objects with date field
        if (Array.isArray(errors.attendance_records)) {
          const recordErrors = errors.attendance_records as Array<{
            date?: string[];
            [key: string]: unknown;
          }>;
          const dateErrors: string[] = [];
          recordErrors.forEach((recordError, index) => {
            if (recordError.date && Array.isArray(recordError.date)) {
              recordError.date.forEach((msg: string) => {
                dateErrors.push(`Record ${index + 1}: ${msg}`);
              });
            }
            // Check for other field errors
            Object.entries(recordError).forEach(([field, messages]) => {
              if (field !== 'date' && Array.isArray(messages)) {
                (messages as string[]).forEach((msg: string) => {
                  dateErrors.push(`Record ${index + 1} (${field}): ${msg}`);
                });
              }
            });
          });

          if (dateErrors.length > 0) {
            dateErrors.forEach((msg) => toast.error(msg, { duration: 6000 }));
            onErrorCallback?.(error);
            return;
          }
        }
      }

      // Check for any other field-level errors
      if (errors && typeof errors === 'object') {
        const fieldErrors: string[] = [];
        Object.entries(errors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg: string | unknown) => {
              if (typeof msg === 'string') {
                fieldErrors.push(`${field}: ${msg}`);
              }
            });
          } else if (typeof messages === 'string') {
            fieldErrors.push(`${field}: ${messages}`);
          }
        });

        if (fieldErrors.length > 0) {
          fieldErrors.forEach((msg) => toast.error(msg, { duration: 6000 }));
          onErrorCallback?.(error);
          return;
        }
      }

      // Fallback to general error message
      toast.error(
        err?.response?.data?.message ||
          ErrorMessages.ATTENDANCE.TIMESHEET_SUBMIT_FAILED,
        { duration: 5000 }
      );
      onErrorCallback?.(error);
    },
  });
}

export function useReturnTimesheetToDraft(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { week_start_date: string; week_end_date: string }) =>
      returnTimesheetToDraft(params),
    onSuccess: () => {
      toast.success('Timesheet returned to draft successfully');
      queryClient.invalidateQueries({ queryKey: ['timesheet-status'] });
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to return timesheet to draft');
    },
  });
}
