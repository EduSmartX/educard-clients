import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { isWeekend, type WorkingDayPolicy } from '@/features/attendance/utils';
import { resolveDayState } from '@/features/attendance/utils/calendar-day-state';
import { DayIcon } from './day-icon';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthlyCalendarCardProps {
  selectedYear: number;
  selectedMonth: number;
  attendanceByDate: Map<string, { morning_present: boolean; afternoon_present: boolean }>;
  leaveByDate: Map<string, { status: string }>;
  holidaySet: Set<string>;
  exceptionalWorkByDate: Map<string, { override_type: string }>;
  workingDayPolicy: WorkingDayPolicy | null;
}

export function MonthlyCalendarCard({
  selectedYear,
  selectedMonth,
  attendanceByDate,
  leaveByDate,
  holidaySet,
  exceptionalWorkByDate,
  workingDayPolicy,
}: Readonly<MonthlyCalendarCardProps>) {
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmptyDays = Array.from({ length: monthStart.getDay() });

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            {MONTHS[selectedMonth]} {selectedYear}
          </CardTitle>
          <Badge variant="outline" className="text-base">
            {MONTHS[selectedMonth]} {selectedYear}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-1 text-center text-xs font-semibold text-gray-600">
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1">
          {leadingEmptyDays.map((_, index) => (
            <div
              key={`empty-day-${selectedMonth}-${index}`}
              className="aspect-square rounded border border-transparent"
            />
          ))}

          {monthDays.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const attendance = attendanceByDate.get(dateKey);
            const leave = leaveByDate.get(dateKey);
            const exception = exceptionalWorkByDate.get(dateKey);
            const isHoliday = holidaySet.has(dateKey);
            const isFuture = date > new Date();
            const isWeekendDay = isWeekend(date, workingDayPolicy);

            const { bgColor, textColor, iconType, statusLabel } = resolveDayState({
              attendance,
              leave,
              exception,
              isHoliday,
              isFuture,
              isWeekendDay,
            });

            return (
              <div
                key={dateKey}
                className={`flex aspect-square flex-col items-center justify-between rounded border p-1 transition ${bgColor}`}
              >
                <div className="w-full text-center">
                  <div className="text-[7px] font-medium text-gray-500">{format(date, 'EEE')}</div>
                  <div className={`text-xs font-bold ${textColor}`}>{format(date, 'd')}</div>
                </div>
                <div className="flex w-full flex-1 flex-col items-center justify-center">
                  <DayIcon iconType={iconType} />
                  {statusLabel ? (
                    <div className="mt-0.5 text-[7px] font-medium text-purple-600">
                      {statusLabel}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
