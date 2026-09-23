import { useQuery } from '@tanstack/react-query';
import { getAttendanceSummary, getAttendanceCalendar, getYearlyReport } from './api';

export function useAttendanceSummary() {
  return useQuery({
    queryKey: ['student', 'attendance', 'summary'],
    queryFn: getAttendanceSummary,
  });
}

export function useAttendanceCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['student', 'attendance', 'calendar', year, month],
    queryFn: () => getAttendanceCalendar(year, month),
  });
}

export function useYearlyReport() {
  return useQuery({
    queryKey: ['student', 'attendance', 'yearly-report'],
    queryFn: getYearlyReport,
  });
}
