/**
 * Calendar View Component
 * Interactive calendar grid showing holidays for the current month
 */

import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/use-role';
import type { Holiday, CalendarDay } from '../types';
import {
  getHolidayTypeColor,
  formatHolidayType,
  isWeekendHoliday,
  filterNonWeekendHolidays,
  getOngoingHolidays,
  getUpcomingHolidays,
  calculateDuration,
} from '../utils/holiday-utils';
import { HolidayFormDialog } from './holiday-form-dialog';
import { DateActionDialog } from './date-action-dialog';

interface DayColorInfo {
  isSunday: boolean;
  isSaturday: boolean;
  hasSecondSatHoliday: boolean;
  hasSaturdayHoliday: boolean;
  hasSundayHoliday: boolean;
}

function getDayCellBg(
  colors: ReturnType<typeof getHolidayTypeColor> | null,
  isCurrentMonth: boolean,
  isToday: boolean,
  info: DayColorInfo
): string {
  if (colors && isCurrentMonth && !isToday) {
    return colors.bg;
  }
  if (!colors && isCurrentMonth && info.isSunday && info.hasSundayHoliday) {
    return 'bg-red-50';
  }
  if (!colors && isCurrentMonth && info.isSaturday && info.hasSecondSatHoliday) {
    return 'bg-indigo-50';
  }
  if (
    !colors &&
    isCurrentMonth &&
    info.isSaturday &&
    info.hasSaturdayHoliday &&
    !info.hasSecondSatHoliday
  ) {
    return 'bg-blue-50';
  }
  return '';
}

function getDateNumberColor(isCurrentMonth: boolean, isToday: boolean, info: DayColorInfo): string {
  if (isToday) {
    return 'text-blue-700 text-base';
  }
  if (!isCurrentMonth) {
    return 'text-gray-400';
  }
  if (isCurrentMonth && info.isSunday && info.hasSundayHoliday) {
    return 'text-red-600';
  }
  if (isCurrentMonth && info.isSaturday && info.hasSecondSatHoliday) {
    return 'text-indigo-600 font-bold';
  }
  if (isCurrentMonth && info.isSaturday && info.hasSaturdayHoliday && !info.hasSecondSatHoliday) {
    return 'text-blue-600';
  }
  return '';
}

function getDayTitle(day: { isCurrentMonth: boolean; holidays: unknown[] }): string {
  if (!day.isCurrentMonth) {
    return '';
  }
  if (day.holidays.length > 0) {
    return 'Click to manage holidays';
  }
  return 'Click to add holiday';
}

interface CalendarViewProps {
  currentDate: Date;
  holidays: Holiday[];
}

export function CalendarView({ currentDate, holidays }: Readonly<CalendarViewProps>) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateHolidays, setSelectedDateHolidays] = useState<Holiday[]>([]);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { isAdmin } = useRole();
  const today = startOfDay(new Date());

  // Generate calendar grid
  const calendarDays = useMemo((): CalendarDay[] => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const firstDayOfMonth = start.getDay();
    const daysInMonth = end.getDate();
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

    const days: CalendarDay[] = [];

    for (let i = 0; i < totalCells; i++) {
      const dayOffset = i - firstDayOfMonth;
      const date = new Date(start);
      date.setDate(date.getDate() + dayOffset);

      const isCurrentMonth = isSameMonth(date, currentDate);
      const isToday = isSameDay(date, today);

      // Find holidays for this date
      const dayHolidays = holidays.filter((holiday) => {
        const holidayStart = parseISO(holiday.start_date);
        const holidayEnd = parseISO(holiday.end_date);
        return isWithinInterval(date, { start: holidayStart, end: holidayEnd });
      });

      days.push({
        date,
        isCurrentMonth,
        isToday,
        holidays: dayHolidays,
      });
    }

    return days;
  }, [currentDate, holidays, today]);

  // Get ongoing holidays
  const ongoingHolidays = useMemo(() => {
    return getOngoingHolidays(holidays, today);
  }, [holidays, today]);

  // Get upcoming holidays
  const upcomingHolidays = useMemo(() => {
    return getUpcomingHolidays(holidays, today, 5);
  }, [holidays, today]);

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) {
      return;
    }

    // Non-admin users can only view, not add/edit holidays
    if (!isAdmin) {
      return;
    }

    setSelectedDate(day.date);
    setSelectedDateHolidays(day.holidays);

    const nonWeekendHolidays = filterNonWeekendHolidays(day.holidays);
    if (nonWeekendHolidays.length > 0) {
      setShowDateDialog(true);
    } else {
      setShowAddDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border-2 border-blue-100 shadow-lg">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="border-r border-white/20 px-2 py-3 text-center text-sm font-semibold text-white last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 bg-white">
              {calendarDays.map((day) => {
                const primaryHoliday = day.holidays[0];
                const colors = primaryHoliday
                  ? getHolidayTypeColor(primaryHoliday.holiday_type)
                  : null;
                const nonWeekendHolidays = filterNonWeekendHolidays(day.holidays);

                // Check for weekend days
                const dayColorInfo: DayColorInfo = {
                  isSunday: day.date.getDay() === 0,
                  isSaturday: day.date.getDay() === 6,
                  hasSecondSatHoliday: day.holidays.some(
                    (h) => h.holiday_type === 'SECOND_SATURDAY'
                  ),
                  hasSaturdayHoliday: day.holidays.some((h) => h.holiday_type === 'SATURDAY'),
                  hasSundayHoliday: day.holidays.some((h) => h.holiday_type === 'SUNDAY'),
                };

                return (
                  <div
                    key={day.date.toISOString()}
                    role="button"
                    tabIndex={day.isCurrentMonth ? 0 : -1}
                    className={cn(
                      'min-h-[80px] cursor-pointer border-r border-b transition-all duration-200 sm:min-h-[100px]',
                      'hover:shadow-inner hover:ring-2 hover:ring-blue-300',
                      !day.isCurrentMonth &&
                        'cursor-default bg-gray-50/50 text-gray-400 hover:shadow-none hover:ring-0',
                      day.isToday && 'ring-2 ring-blue-500 ring-inset',
                      getDayCellBg(colors, day.isCurrentMonth, day.isToday, dayColorInfo),
                      'last:border-r-0'
                    )}
                    onClick={() => handleDateClick(day)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDateClick(day);
                      }
                    }}
                    title={getDayTitle(day)}
                  >
                    <div className="p-2">
                      {/* Date Number */}
                      <div
                        className={cn(
                          'mb-1 text-sm font-semibold',
                          getDateNumberColor(day.isCurrentMonth, day.isToday, dayColorInfo)
                        )}
                      >
                        {format(day.date, 'd')}
                      </div>

                      {/* Weekend Badge */}
                      {day.isCurrentMonth && dayColorInfo.hasSecondSatHoliday && (
                        <div className="mb-1 truncate rounded-md border border-indigo-200 bg-indigo-100 px-1.5 py-0.5 text-[10px] leading-tight font-medium text-indigo-700 shadow-sm">
                          2nd Sat
                        </div>
                      )}
                      {day.isCurrentMonth &&
                        dayColorInfo.hasSaturdayHoliday &&
                        !dayColorInfo.hasSecondSatHoliday && (
                          <div className="mb-1 truncate rounded-md border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[10px] leading-tight font-medium text-blue-700 shadow-sm">
                            Saturday
                          </div>
                        )}

                      {/* Holidays */}
                      {day.holidays.length > 0 && day.isCurrentMonth && (
                        <div className="space-y-1">
                          {day.holidays.slice(0, 2).map((holiday) => {
                            if (isWeekendHoliday(holiday)) {
                              return null;
                            }
                            const holidayColors = getHolidayTypeColor(holiday.holiday_type);
                            return (
                              <div
                                key={holiday.public_id}
                                className={cn(
                                  'truncate rounded-md border px-1.5 py-0.5 text-[10px] leading-tight font-medium shadow-sm',
                                  holidayColors.text,
                                  holidayColors.border,
                                  holidayColors.badge
                                )}
                                title={holiday.description}
                              >
                                {holiday.description}
                              </div>
                            );
                          })}
                          {nonWeekendHolidays.length > 2 && (
                            <div className="px-1 text-[9px] font-medium text-gray-600">
                              +{nonWeekendHolidays.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Holidays Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-2 border-blue-100 shadow-lg">
            <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-blue-900">
                <CalendarIcon className="h-4 w-4" />
                Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Ongoing Holidays Section */}
              {ongoingHolidays.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3 flex items-center gap-1 text-xs font-semibold tracking-wide text-green-700 uppercase">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                    Ongoing Now
                  </h4>
                  <div className="space-y-3">
                    {ongoingHolidays.map((holiday) => {
                      const colors = getHolidayTypeColor(holiday.holiday_type);
                      const duration = calculateDuration(holiday.start_date, holiday.end_date);
                      return (
                        <div
                          key={holiday.public_id}
                          className="rounded-lg border-2 border-green-200 bg-green-50 p-3 shadow-sm"
                        >
                          <div className="mb-2 flex items-start gap-2">
                            <div
                              className={cn(
                                'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full shadow-sm',
                                colors.badge
                              )}
                            />
                            <span className="flex-1 text-sm font-semibold text-gray-900">
                              {holiday.description}
                            </span>
                          </div>
                          <div className="mb-2 text-xs text-gray-600">
                            {format(parseISO(holiday.start_date), 'MMM dd, yyyy')}
                            {duration > 1 &&
                              ` - ${format(parseISO(holiday.end_date), 'MMM dd, yyyy')}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="border border-gray-300 bg-gray-100 px-2 py-0 text-xs text-gray-700"
                            >
                              {duration} {duration === 1 ? 'Day' : 'Days'}
                            </Badge>
                            <Badge
                              className={cn(colors.badge, 'border-0 px-2 py-0 text-xs shadow-sm')}
                            >
                              {formatHolidayType(holiday.holiday_type)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="my-4 border-t border-gray-200"></div>
                </div>
              )}

              {/* Upcoming Holidays Section */}
              {upcomingHolidays.length > 0 ? (
                <div className="space-y-3">
                  {upcomingHolidays.map((holiday) => {
                    const colors = getHolidayTypeColor(holiday.holiday_type);
                    const duration = calculateDuration(holiday.start_date, holiday.end_date);
                    return (
                      <div
                        key={holiday.public_id}
                        className="rounded-lg border-2 border-gray-200 bg-white p-3 transition-all duration-200 hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-start gap-2">
                          <div
                            className={cn(
                              'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full shadow-sm',
                              colors.badge
                            )}
                          />
                          <span className="flex-1 text-sm font-semibold text-gray-900">
                            {holiday.description}
                          </span>
                        </div>
                        <div className="mb-2 text-xs text-gray-600">
                          {format(parseISO(holiday.start_date), 'MMM dd, yyyy')}
                          {duration > 1 &&
                            ` - ${format(parseISO(holiday.end_date), 'MMM dd, yyyy')}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="border border-gray-300 bg-gray-100 px-2 py-0 text-xs text-gray-700"
                          >
                            {duration} {duration === 1 ? 'Day' : 'Days'}
                          </Badge>
                          <Badge
                            className={cn(colors.badge, 'border-0 px-2 py-0 text-xs shadow-sm')}
                          >
                            {formatHolidayType(holiday.holiday_type)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !ongoingHolidays.length && (
                  <div className="py-8 text-center">
                    <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-sm text-gray-500">No upcoming holidays</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card className="border border-gray-100 shadow-md">
        <CardContent className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-gray-600">Legend:</span>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-red-200 bg-red-50" />
              <span className="text-gray-600">Sunday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-indigo-200 bg-indigo-50" />
              <span className="text-gray-600">2nd Saturday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-blue-200 bg-blue-50" />
              <span className="text-gray-600">Saturday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-red-300 bg-red-100" />
              <span className="text-gray-600">National Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-orange-300 bg-orange-100" />
              <span className="text-gray-600">Festival</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded border border-green-300 bg-green-100" />
              <span className="text-gray-600">Organization</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <HolidayFormDialog
        mode="create"
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />
      <DateActionDialog
        open={showDateDialog}
        onOpenChange={setShowDateDialog}
        date={selectedDate}
        holidays={selectedDateHolidays}
        onAddAnother={() => {
          setShowDateDialog(false);
          setShowAddDialog(true);
        }}
      />
    </div>
  );
}
