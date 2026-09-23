import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  bulkSubmitEmployeeAttendance,
  returnTimesheetToDraft,
} from '@/features/attendance/api/attendance-api';
import { ErrorMessages, SuccessMessages } from '@/constants';
import { handleMutationError } from '@/lib/utils/mutation-utils';

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
  onErrorCallback?: (error: Error, fieldErrors?: Record<string, string | undefined>) => void;
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
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.ATTENDANCE.TIMESHEET_SUBMIT_FAILED, onErrorCallback);
    },
  });
}

export function useReturnTimesheetToDraft(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { week_start_date: string; week_end_date: string }) =>
      returnTimesheetToDraft(params),
    onSuccess: (data) => {
      const message = data?.message || 'Timesheet returned to draft successfully';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['timesheet-status'] });
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, 'Failed to return timesheet to draft');
    },
  });
}
