/**
 * useTimesheetMutations - submit / return-to-draft / daily-save mutations for the
 * employee timesheet screen. Extracted to keep the screen under the 500-line limit.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { handleMutationError } from '@/lib/mutation-utils';
import { useToast } from '@/lib/toast-context';
import { useCriticalOperation } from '@/providers/critical-operation-context';

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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();

  const submitMutation = useMutation({
    mutationFn: bulkSubmitAttendance,
    onMutate: () => {
      beginCriticalOperation({
        title: 'Submitting timesheet',
        description: 'Submitting attendance for approval...',
      });
    },
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
    onSettled: () => {
      endCriticalOperation();
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
    onMutate: () => {
      beginCriticalOperation({
        title: 'Saving attendance',
        description: 'Saving attendance records...',
      });
    },
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
    onSettled: () => {
      endCriticalOperation();
    },
  });

  return { submitMutation, returnToDraftMutation, dailyAttendanceMutation };
}
