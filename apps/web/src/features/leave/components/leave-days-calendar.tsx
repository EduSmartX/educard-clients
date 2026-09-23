/**
 * Leave Days Calendar
 * Read-only month view that highlights which days of the selected range count
 * as leave vs. holidays/weekends, so users can see their leave at a glance.
 */
import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { HolidayInfo } from '../types';

interface LeaveDaysCalendarProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  holidays: HolidayInfo[];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseYmd(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

interface MonthCells {
  key: string;
  label: string;
  days: (Date | null)[];
}

export function LeaveDaysCalendar({ startDate, endDate, holidays }: LeaveDaysCalendarProps) {
  const { months, holidaySet, startTime, endTime } = useMemo(() => {
    const empty = {
      months: [] as MonthCells[],
      holidaySet: new Set<string>(),
      startTime: 0,
      endTime: 0,
    };
    if (!startDate || !endDate) {
      return empty;
    }

    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    if (end < start) {
      return empty;
    }

    const set = new Set(holidays.map((holiday) => holiday.date));
    const list: MonthCells[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    let guard = 0;

    while (cursor <= last && guard < 12) {
      guard += 1;
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const firstWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: (Date | null)[] = [];
      for (let i = 0; i < firstWeekday; i += 1) {
        days.push(null);
      }
      for (let d = 1; d <= daysInMonth; d += 1) {
        days.push(new Date(year, month, d));
      }
      list.push({
        key: `${year}-${month}`,
        label: cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        days,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { months: list, holidaySet: set, startTime: start.getTime(), endTime: end.getTime() };
  }, [startDate, endDate, holidays]);

  if (months.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Leave Calendar</p>
      <div className="flex flex-wrap gap-4">
        {months.map((monthData) => (
          <div key={monthData.key} className="rounded-lg border p-3">
            <p className="mb-2 text-center text-sm font-semibold">{monthData.label}</p>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-muted-foreground text-center text-[0.7rem] font-medium"
                >
                  {weekday}
                </div>
              ))}
              {monthData.days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-8 w-8" />;
                }
                const time = day.getTime();
                const inRange = time >= startTime && time <= endTime;
                const isHoliday = holidaySet.has(toYmd(day));
                const isLeave = inRange && !isHoliday;
                return (
                  <div
                    key={toYmd(day)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-xs',
                      isLeave && 'bg-blue-600 font-semibold text-white',
                      inRange && isHoliday && 'bg-red-100 text-red-500 line-through',
                      !inRange && 'text-muted-foreground/40'
                    )}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-600" /> Leave day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-300 ring-inset" /> Holiday /
          weekend
        </span>
      </div>
    </div>
  );
}
