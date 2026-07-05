import { useQuery } from '@tanstack/react-query';

import { getTimesheetSubmissions } from '../../api/attendance-api';

export type { TimesheetSubmission } from '../../api/attendance-api';

interface UseTimesheetSubmissionsOptions {
  employee?: string;
  status?: string;
  week_start_date?: string;
  week_end_date?: string;
}

export function useTimesheetSubmissions(options?: UseTimesheetSubmissionsOptions) {
  // Map 'status' to 'submission_status' for the API
  const apiParams = options
    ? {
        ...options,
        submission_status: options.status,
        status: undefined, // Remove the original status
      }
    : undefined;

  return useQuery({
    queryKey: ['timesheet-submissions', options],
    queryFn: () => getTimesheetSubmissions(apiParams),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
