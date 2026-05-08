import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchCalendarGridData } from '../api/attendance-api';

interface YearlyCalendarGridProps {
  userId: string;
  year?: number;
  academicYearName?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to check if date is a weekend based on working day policy
function isWeekend(
  date: Date,
  workingDayPolicy?: { sunday_off: boolean; saturday_off_pattern: string } | null
): boolean {
  if (!workingDayPolicy) {
    return false;
  }

  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Sunday off check
  if (workingDayPolicy.sunday_off && dayOfWeek === 0) {
    return true;
  }

  // Saturday off check
  if (dayOfWeek === 6) {
    const pattern = workingDayPolicy.saturday_off_pattern;

    if (pattern === 'ALL') {
      return true;
    } else if (pattern === 'SECOND_ONLY' || pattern === 'SECOND_AND_FOURTH') {
      // Calculate which Saturday of the month this is
      const dayOfMonth = date.getDate();
      const saturdayNumber = Math.ceil(dayOfMonth / 7);

      if (pattern === 'SECOND_ONLY' && saturdayNumber === 2) {
        return true;
      } else if (pattern === 'SECOND_AND_FOURTH' && (saturdayNumber === 2 || saturdayNumber === 4)) {
        return true;
      }
    }
  }

  return false;
}

// Get cell color based on status
function getCellColor(status: 'P' | 'HP' | 'A' | 'L' | 'H' | 'W' | '-' | null): string {
  switch (status) {
    case 'P':
      return 'bg-green-100 text-green-800 font-semibold';
    case 'HP':
      return 'bg-yellow-100 text-yellow-800 font-semibold';
    case 'A':
      return 'bg-red-100 text-red-800 font-semibold';
    case 'L':
      return 'bg-orange-100 text-orange-800 font-semibold';
    case 'H':
      return 'bg-purple-100 text-purple-800 font-semibold';
    case 'W':
      return 'bg-gray-100 text-gray-600 font-semibold';
    case '-':
      return 'bg-gray-50 text-gray-400';
    default:
      return 'bg-gray-50 text-gray-400';
  }
}

export function YearlyCalendarGrid({ 
  userId, 
  year = new Date().getFullYear(),
  academicYearName,
}: YearlyCalendarGridProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar-grid', userId, year],
    queryFn: () => fetchCalendarGridData({ user: userId, year }),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic Year Attendance Report - {academicYearName || year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic Year Attendance Report - {academicYearName || year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600 py-8">
            Error loading calendar data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.calendar_data) {
    return null;
  }

  // Get academic year info from response
  const academicYear = data.academic_year;
  const displayYear = academicYear?.name || academicYearName || year.toString();

  // Determine month order based on academic year
  let monthOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Default: Jan-Dec
  
  if (academicYear) {
    // Parse academic year start month from start_date
    const startDate = new Date(academicYear.start_date);
    const startMonth = startDate.getMonth(); // 0-11
    
    // Reorder months starting from academic year start month
    monthOrder = [];
    for (let i = 0; i < 12; i++) {
      monthOrder.push((startMonth + i) % 12);
    }
  }

  // Create a map for quick lookup: month-day -> status
  const statusMap = new Map<string, 'P' | 'HP' | 'A' | 'L' | 'H' | 'W' | '-' | null>();
  data.calendar_data.forEach(item => {
    const key = `${item.month}-${item.day}`;
    statusMap.set(key, item.status as 'P' | 'HP' | 'A' | 'L' | 'H' | 'W' | null);
  });

  // Create holiday set for quick lookup
  const holidayDates = new Set<string>();
  (data.holidays || []).forEach(holiday => {
    const start = new Date(holiday.start_date);
    const end = new Date(holiday.end_date);
    let current = start;
    while (current <= end) {
      holidayDates.add(`${current.getMonth() + 1}-${current.getDate()}`);
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
  });

  // Create exception map
  const exceptionMap = new Map<string, string>();
  (data.calendar_exceptions || []).forEach(exc => {
    const excDate = new Date(exc.date);
    exceptionMap.set(`${excDate.getMonth() + 1}-${excDate.getDate()}`, exc.type);
  });

  // Helper to determine status for a date without attendance record
  const getStatusForDate = (month: number, day: number, currentYear: number): 'H' | 'W' | '-' | null => {
    const key = `${month}-${day}`;
    
    // Determine the correct year for this month based on academic year
    // If academic year starts in May (month 5), then May-Dec use startYear, Jan-Apr use startYear+1
    let actualYear = currentYear;
    if (academicYear) {
      const startDate = new Date(academicYear.start_date);
      const startMonth = startDate.getMonth() + 1; // 1-12
      const startYear = startDate.getFullYear();
      
      // If month is >= start month, use start year, else use start year + 1
      if (month >= startMonth) {
        actualYear = startYear;
      } else {
        actualYear = startYear + 1;
      }
    }
    
    // Check exception first (exceptions override everything)
    const exception = exceptionMap.get(key);
    if (exception === 'FORCE_HOLIDAY') {
      return 'H';
    }
    if (exception === 'FORCE_WORKING') {
      // Force working day without attendance should show null (future) or handled by backend (past)
      return null;
    }
    
    // Check if it's a holiday
    if (holidayDates.has(key)) {
      return 'H';
    }
    
    // Check if it's a weekend (backend no longer sends weekends, so we calculate here)
    try {
      // Create date for checking (use correct year based on academic year)
      const checkDate = new Date(actualYear, month - 1, day);
      const isWeekendResult = isWeekend(checkDate, data.working_day_policy);
      
      // Debug for May 4 and 11
      if (month === 5 && (day === 4 || day === 11)) {
        console.warn(`May ${day} - Date object:`, checkDate, 'Day of week:', checkDate.getDay(), 'isWeekend result:', isWeekendResult);
      }
      
      if (!isNaN(checkDate.getTime()) && isWeekendResult) {
        return 'W';
      }
    } catch {
      // Invalid date (e.g., Feb 30), return dash
      return '-';
    }
    
    // For future dates, return null (no display)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const checkDate = new Date(actualYear, month - 1, day);
      if (checkDate > today) {
        return null; // Future date
      }
    } catch {
      return '-';
    }
    
    // Past working day without data should show '-' (backend should have sent this as 'A')
    // This is a fallback for any edge cases
    return '-';
  };

  // Get maximum days needed (31)
  const maxDays = 31;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            📅 Academic Year Attendance Report - {displayYear}
          </CardTitle>
          <div className="text-sm font-normal text-gray-600">{displayYear}</div>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-700">Present: P</span>
            <span className="text-xs font-semibold text-yellow-700">Half Day: HP</span>
            <span className="text-xs font-semibold text-red-700">Absent: A</span>
            <span className="text-xs font-semibold text-orange-700">Leave: L</span>
            <span className="text-xs font-semibold text-purple-700">Holiday: H</span>
            <span className="text-xs font-semibold text-gray-600">Weekend: W</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 p-2 text-center font-semibold sticky left-0 bg-blue-100 z-10 min-w-[60px]">
                  Date / Month
                </th>
                {monthOrder.map((monthIndex) => (
                  <th
                    key={monthIndex}
                    className="border border-gray-300 p-2 text-center font-semibold min-w-[90px]"
                  >
                    {MONTHS[monthIndex]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxDays }, (_, dayIndex) => {
                const day = dayIndex + 1;
                return (
                  <tr key={day} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 text-center font-semibold sticky left-0 bg-gray-50 z-10">
                      {day}
                    </td>
                    {monthOrder.map((monthIndex) => {
                      const month = monthIndex + 1;
                      const key = `${month}-${day}`;
                      let status = statusMap.get(key);
                      
                      // If no status from backend, determine it using metadata
                      // Backend now excludes weekends, so we calculate them here
                      if (status === undefined || status === null) {
                        status = getStatusForDate(month, day, year);
                      }
                      
                      const cellColor = getCellColor(status);

                      return (
                        <td
                          key={monthIndex}
                          className={`border border-gray-300 p-2 text-center ${cellColor}`}
                        >
                          {status === null ? '-' : status || '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
