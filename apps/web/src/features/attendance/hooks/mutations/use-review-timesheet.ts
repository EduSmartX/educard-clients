import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { reviewTimesheet } from '@/features/attendance/api/attendance-api';
import { ErrorMessages, SuccessMessages, type TimesheetReviewActionValue } from '@/constants';
import { handleMutationError } from '@/lib/utils/mutation-utils';

interface ReviewTimesheetParams {
  publicId: string;
  data: {
    submission_status: TimesheetReviewActionValue;
    review_comments?: string;
  };
}

export function useReviewTimesheet(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: ReviewTimesheetParams) => reviewTimesheet(publicId, data),
    onSuccess: (response) => {
      const message = response?.message || SuccessMessages.ATTENDANCE.TIMESHEET_REVIEW_SUCCESS;
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['timesheet-submissions'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.ATTENDANCE.TIMESHEET_REVIEW_FAILED);
    },
  });
}
