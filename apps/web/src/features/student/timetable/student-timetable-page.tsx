import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react';
import { addDays, startOfWeek, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SCHOOL_WEEKDAYS, formatSlotTime, getSubjectColor, isBreakSlot } from '@educard/shared';
import { PageHeader, SubjectAvatar } from '@/components/common';
import { breakRowClasses, subjectRowClasses } from '@/lib/subject-row';
import { useTimetableForWeek } from './hooks';

export default function StudentTimetablePage() {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const todayDayIndex = today.getDay() === 0 ? 5 : today.getDay() - 1;
  const [selectedDay, setSelectedDay] = useState(Math.min(todayDayIndex, 5));

  const currentMonday = useMemo(() => {
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    return addDays(monday, weekOffset * 7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const { results } = useTimetableForWeek(currentMonday);
  const selectedResult = results[selectedDay];
  const periods = selectedResult?.data ?? [];
  const isLoading = selectedResult?.isLoading ?? true;

  const weekLabel = `${format(currentMonday, 'd MMM')} — ${format(addDays(currentMonday, 5), 'd MMM')}`;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" description="Your weekly class schedule 🗓️" icon={Calendar} />

      {/* Week Navigator */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{weekLabel}</p>
          {isCurrentWeek && <span className="text-xs text-blue-500">This Week</span>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SCHOOL_WEEKDAYS.map((day, i) => {
          const dayDate = addDays(currentMonday, i);
          const isToday = format(dayDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          let dayTabClass = 'bg-gray-50 text-gray-600 hover:bg-gray-100';
          if (selectedDay === i) {
            dayTabClass =
              'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200';
          } else if (isToday) {
            dayTabClass = 'bg-blue-50 text-blue-600 ring-2 ring-blue-300';
          }
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(i)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${dayTabClass}`}
            >
              <span>{day.slice(0, 3)}</span>
              <span className="ml-1 text-[10px] opacity-70">{dayDate.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Period List */}
      <motion.div
        key={`${weekOffset}-${selectedDay}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {(() => {
          if (isLoading) {
            return Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ));
          }
          if (periods.length === 0) {
            return (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <span className="text-5xl">🌴</span>
                  <p className="text-lg font-medium text-gray-600">No classes this day!</p>
                  <p className="text-sm text-gray-400">Enjoy your free time 🎉</p>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="hidden gap-2 border-b bg-gray-50/80 px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase sm:grid sm:grid-cols-[auto_2fr_1fr_1.5fr_1fr]">
                  <span className="w-12">#</span>
                  <span>Subject</span>
                  <span>Time</span>
                  <span>Teacher</span>
                  <span>Room</span>
                </div>
                {/* Rows */}
                <div className="space-y-2 p-3">
                  {periods.map((period, index) => {
                    const isBreak = isBreakSlot(period.slot_type);
                    const subjectColor = getSubjectColor(period.subject_name);
                    const label = isBreak
                      ? period.label
                      : (period.subject_name || '').trim() || period.label;
                    let rowClass = subjectRowClasses(subjectColor);
                    if (period.is_cancelled) {
                      rowClass = subjectRowClasses(subjectColor, true);
                    } else if (isBreak) {
                      rowClass = breakRowClasses();
                    }

                    return (
                      <motion.div
                        key={period.slot_public_id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[auto_2fr_1fr_1.5fr_1fr] sm:items-center ${rowClass}`}
                      >
                        {/* Slot # */}
                        <div className="flex items-center gap-3 sm:w-12">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold shadow-sm ${
                              isBreak
                                ? 'bg-emerald-100 text-emerald-700'
                                : `${subjectColor.bg} ${subjectColor.text}`
                            }`}
                          >
                            {period.slot_number}
                          </div>
                        </div>
                        {/* Subject */}
                        <div className="flex items-center gap-2">
                          {isBreak ? (
                            <span className="text-lg">☕</span>
                          ) : (
                            <SubjectAvatar name={period.subject_name} size="md" />
                          )}
                          <div className="min-w-0">
                            <p
                              className={`font-medium ${
                                isBreak ? 'text-emerald-800' : subjectColor.text
                              }`}
                            >
                              {label}
                            </p>
                            {period.is_cancelled && (
                              <Badge variant="destructive" className="mt-0.5 text-[10px]">
                                Cancelled
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Time */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 sm:flex-col sm:items-start sm:gap-0">
                          <Clock className="h-3.5 w-3.5 text-gray-400 sm:hidden" />
                          <span className="font-medium">{formatSlotTime(period.start_time)}</span>
                          <span className="text-xs text-gray-400">
                            to {formatSlotTime(period.end_time)}
                          </span>
                        </div>
                        {/* Teacher */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <User className="h-3.5 w-3.5 text-gray-400 sm:hidden" />
                          <span className={period.teacher_name ? '' : 'text-gray-400'}>
                            {period.teacher_name || '—'}
                          </span>
                        </div>
                        {/* Room */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 sm:hidden" />
                          <span className={period.room ? '' : 'text-gray-400'}>
                            {period.room || '—'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </motion.div>
    </div>
  );
}
