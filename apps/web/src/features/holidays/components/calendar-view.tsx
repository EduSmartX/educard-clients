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

interface CalendarViewProps {
  currentDate: Date;
  holidays: Holiday[];
}

export function CalendarView({ currentDate, holidays }: CalendarViewProps) {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border-2 border-blue-100 shadow-lg">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="border-r border-white/20 last:border-r-0 px-2 py-3 text-center text-sm font-semibold text-white"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 bg-white">
              {calendarDays.map((day, index) => {
                const primaryHoliday = day.holidays[0];
                const colors = primaryHoliday
                  ? getHolidayTypeColor(primaryHoliday.holiday_type)
                  : null;
                const nonWeekendHolidays = filterNonWeekendHolidays(day.holidays);
                
                // Check for weekend days
                const isSunday = day.date.getDay() === 0;
                const isSaturday = day.date.getDay() === 6;
                const hasSecondSatHoliday = day.holidays.some(h => h.holiday_type === 'SECOND_SATURDAY');
                const hasSaturdayHoliday = day.holidays.some(h => h.holiday_type === 'SATURDAY');
                const hasSundayHoliday = day.holidays.some(h => h.holiday_type === 'SUNDAY');

                return (
                  <div
                    key={index}
                    role="button"
                    tabIndex={day.isCurrentMonth ? 0 : -1}
                    className={cn(
                      'min-h-[80px] sm:min-h-[100px] border-r border-b cursor-pointer transition-all duration-200',
                      'hover:shadow-inner hover:ring-2 hover:ring-blue-300',
                      !day.isCurrentMonth &&
                        'bg-gray-50/50 text-gray-400 cursor-default hover:shadow-none hover:ring-0',
                      day.isToday && 'ring-2 ring-blue-500 ring-inset',
                      // Apply holiday colors
                      colors && day.isCurrentMonth && !day.isToday && colors.bg,
                      // Sunday coloring (light red/pink)
                      !colors && day.isCurrentMonth && isSunday && hasSundayHoliday && 'bg-red-50',
                      // Second Saturday coloring (indigo)
                      !colors && day.isCurrentMonth && isSaturday && hasSecondSatHoliday && 'bg-indigo-50',
                      // Regular Saturday coloring (light blue)
                      !colors && day.isCurrentMonth && isSaturday && hasSaturdayHoliday && !hasSecondSatHoliday && 'bg-blue-50',
                      'last:border-r-0'
                    )}
                    onClick={() => handleDateClick(day)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDateClick(day);
                      }
                    }}
                    title={
                      day.isCurrentMonth
                        ? day.holidays.length > 0
                          ? 'Click to manage holidays'
                          : 'Click to add holiday'
                        : ''
                    }
                  >
                    <div className="p-2">
                      {/* Date Number */}
                      <div
                        className={cn(
                          'mb-1 text-sm font-semibold',
                          day.isToday && 'text-blue-700 text-base',
                          !day.isToday && !day.isCurrentMonth && 'text-gray-400',
                          // Sunday date color
                          day.isCurrentMonth && !day.isToday && isSunday && hasSundayHoliday && 'text-red-600',
                          // Second Saturday date color
                          day.isCurrentMonth && !day.isToday && isSaturday && hasSecondSatHoliday && 'text-indigo-600 font-bold',
                          // Regular Saturday date color
                          day.isCurrentMonth && !day.isToday && isSaturday && hasSaturdayHoliday && !hasSecondSatHoliday && 'text-blue-600'
                        )}
                      >
                        {format(day.date, 'd')}
                      </div>

                      {/* Weekend Badge */}
                      {day.isCurrentMonth && hasSecondSatHoliday && (
                        <div className="mb-1 truncate rounded-md px-1.5 py-0.5 text-[10px] leading-tight font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                          2nd Sat
                        </div>
                      )}
                      {day.isCurrentMonth && hasSaturdayHoliday && !hasSecondSatHoliday && (
                        <div className="mb-1 truncate rounded-md px-1.5 py-0.5 text-[10px] leading-tight font-medium bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
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
                                  'truncate rounded-md px-1.5 py-0.5 text-[10px] leading-tight font-medium border shadow-sm',
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
                            <div className="text-[9px] text-gray-600 font-medium px-1">
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
          <Card className="shadow-lg border-2 border-blue-100">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                <CalendarIcon className="h-4 w-4" />
                Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Ongoing Holidays Section */}
              {ongoingHolidays.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
                          <div className="flex items-start gap-2 mb-2">
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full mt-1.5 flex-shrink-0 shadow-sm',
                                colors.badge
                              )}
                            />
                            <span className="text-sm font-semibold text-gray-900 flex-1">
                              {holiday.description}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {format(parseISO(holiday.start_date), 'MMM dd, yyyy')}
                            {duration > 1 &&
                              ` - ${format(parseISO(holiday.end_date), 'MMM dd, yyyy')}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0 bg-gray-100 text-gray-700 border border-gray-300"
                            >
                              {duration} {duration === 1 ? 'Day' : 'Days'}
                            </Badge>
                            <Badge
                              className={cn(colors.badge, 'text-xs px-2 py-0 border-0 shadow-sm')}
                            >
                              {formatHolidayType(holiday.holiday_type)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-200 my-4"></div>
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
                        className="rounded-lg border-2 border-gray-200 bg-white p-3 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full mt-1.5 flex-shrink-0 shadow-sm',
                              colors.badge
                            )}
                          />
                          <span className="text-sm font-semibold text-gray-900 flex-1">
                            {holiday.description}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {format(parseISO(holiday.start_date), 'MMM dd, yyyy')}
                          {duration > 1 &&
                            ` - ${format(parseISO(holiday.end_date), 'MMM dd, yyyy')}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0 bg-gray-100 text-gray-700 border border-gray-300"
                          >
                            {duration} {duration === 1 ? 'Day' : 'Days'}
                          </Badge>
                          <Badge
                            className={cn(colors.badge, 'text-xs px-2 py-0 border-0 shadow-sm')}
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
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No upcoming holidays</p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card className="shadow-md border border-gray-100">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-gray-600">Legend:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
              <span className="text-gray-600">Sunday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-200" />
              <span className="text-gray-600">2nd Saturday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
              <span className="text-gray-600">Saturday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span className="text-gray-600">National Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
              <span className="text-gray-600">Festival</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
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
