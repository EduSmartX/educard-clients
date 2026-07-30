/**
 * useTimesheetMutations - submit / return-to-draft / daily-save mutations for the
 * employee timesheet screen. Extracted to keep the screen under the 500-line limit.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { handleMutationError } from '@/lib/mutation-utils';
import { useToast } from '@/lib/toast-context';

import {
  bulkSubmitAttendance,
  returnTimesheetToDraft,
} from './timesheet-utils';

interface UseTimesheetMutationsOptions {
  onSubmitted: () => void;
  onReturnedToDraft: (weekStart: string) => void;
  onDailySaved: () => void;
}

export function useTimesheetMutations({
  onSubmitted,
  onReturnedToDraft,
  onDailySaved,
}: UseTimesheetMutationsOptions) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: bulkSubmitAttendance,
    onSuccess: response => {
      showToast({
        type: 'success',
        title: 'Success',
        message: response?.message || 'Timesheet submitted for approval',
      });
      void queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      onSubmitted();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to submit timesheet');
    },
  });

  const returnToDraftMutation = useMutation({
    mutationFn: returnTimesheetToDraft,
    onSuccess: (response, variables) => {
      showToast({
        type: 'success',
        title: 'Success',
        message: response?.message || 'Timesheet returned to draft',
      });
      void queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      onReturnedToDraft(variables.week_start_date);
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to return to draft');
    },
  });

  const dailyAttendanceMutation = useMutation({
    mutationFn: bulkSubmitAttendance,
    onSuccess: response => {
      showToast({
        type: 'success',
        title: 'Success',
        message: response?.message || 'Attendance saved successfully',
      });
      void queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      onDailySaved();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save attendance');
    },
  });

  return { submitMutation, returnToDraftMutation, dailyAttendanceMutation };
}
