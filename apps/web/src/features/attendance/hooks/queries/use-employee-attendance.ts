import { useQuery } from '@tanstack/react-query';

import { getEmployeeAttendance } from '../../api/attendance-api';

interface UseEmployeeAttendanceOptions {
  from_date: string;
  to_date: string;
  employee?: string;
}

export function useEmployeeAttendance(
  options: UseEmployeeAttendanceOptions,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['employee-attendance', options],
    queryFn: () => getEmployeeAttendance(options),
    enabled: enabled && !!options.from_date && !!options.to_date,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
