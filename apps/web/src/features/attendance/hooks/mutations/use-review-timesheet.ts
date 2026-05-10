import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { reviewTimesheet } from '@/features/attendance/api/attendance-api';
import { ErrorMessages, SuccessMessages, type TimesheetReviewActionValue } from '@/constants';

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
    mutationFn: ({ publicId, data }: ReviewTimesheetParams) => 
      reviewTimesheet(publicId, data),
    onSuccess: () => {
      toast.success(SuccessMessages.ATTENDANCE.TIMESHEET_REVIEW_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ['timesheet-submissions'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.ATTENDANCE.TIMESHEET_REVIEW_FAILED);
    },
  });
}
