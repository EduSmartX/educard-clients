import { useQueries } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { getTimetableForDate } from './api';

export function useTimetableForWeek(weekMonday: Date) {
  const dates = Array.from({ length: 6 }, (_, i) => format(addDays(weekMonday, i), 'yyyy-MM-dd'));

  const results = useQueries({
    queries: dates.map((dateStr) => ({
      queryKey: ['student', 'timetable', dateStr],
      queryFn: () => getTimetableForDate(dateStr),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return { results, dates };
}
