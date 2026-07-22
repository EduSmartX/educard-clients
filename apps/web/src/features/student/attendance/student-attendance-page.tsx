import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Flower2,
  TreePine,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MONTH_NAMES, WEEKDAY_NAMES_SHORT } from '@educard/shared';
import { PageHeader } from '@/components/common';
import { useAttendanceSummary, useAttendanceCalendar, useYearlyReport } from './hooks';
import type { CalendarDay } from './api';

function getStatusColor(status: CalendarDay['status']) {
  switch (status) {
    case 'present':
      return 'bg-emerald-400 text-white';
    case 'absent':
      return 'bg-red-400 text-white';
    case 'half_day':
      return 'bg-amber-400 text-white';
    case 'holiday':
      return 'bg-sky-200 text-sky-700';
    case 'weekend':
      return 'bg-gray-100 text-gray-400';
    default:
      return 'bg-gray-50 text-gray-300';
  }
}

function getStatusEmoji(status: CalendarDay['status']) {
  switch (status) {
    case 'present':
      return '🌻';
    case 'absent':
      return '🌧️';
    case 'half_day':
      return '🌤️';
    case 'holiday':
      return '🎉';
    default:
      return '';
  }
}

function getGrowthDisplay(growthRate: number | null | undefined) {
  const isPositive = !!growthRate && growthRate >= 0;
  return {
    icon: isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
    color: isPositive ? 'from-emerald-400 to-teal-500' : 'from-orange-400 to-red-500',
    emoji: isPositive ? '🦋' : '🐛',
  };
}

function AttendanceSummaryStats({
  isLoading,
  summary,
}: Readonly<{
  isLoading: boolean;
  summary:
    | {
        current_month: { percentage: number; present_days: number; working_days: number };
        academic_year_percentage: number;
        growth_rate?: number | null;
      }
    | undefined;
}>) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </>
    );
  }
  const growth = getGrowthDisplay(summary?.growth_rate);
  return (
    <>
      <StatCard
        label="This Month"
        value={`${summary?.current_month.percentage ?? 0}%`}
        icon={<Sun className="h-5 w-5" />}
        color="from-emerald-400 to-green-500"
        emoji="🌻"
      />
      <StatCard
        label="Academic Year"
        value={`${summary?.academic_year_percentage ?? 0}%`}
        icon={<TreePine className="h-5 w-5" />}
        color="from-blue-400 to-indigo-500"
        emoji="🌳"
      />
      <StatCard
        label="Present Days"
        value={`${summary?.current_month.present_days ?? 0}/${summary?.current_month.working_days ?? 0}`}
        icon={<Flower2 className="h-5 w-5" />}
        color="from-pink-400 to-rose-500"
        emoji="🌸"
      />
      <StatCard
        label="Growth"
        value={`${(summary?.growth_rate ?? 0) > 0 ? '+' : ''}${summary?.growth_rate?.toFixed(1) ?? 0}%`}
        icon={growth.icon}
        color={growth.color}
        emoji={growth.emoji}
      />
    </>
  );
}

function AttendanceCalendarGrid({
  isLoading,
  calYear,
  calMonth,
  firstDayOfMonth,
  daysInMonth,
  calendar,
  today,
}: Readonly<{
  isLoading: boolean;
  calYear: number;
  calMonth: number;
  firstDayOfMonth: number;
  daysInMonth: number;
  calendar: CalendarDay[] | undefined;
  today: Date;
}>) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAY_NAMES_SHORT.map((d) => (
        <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
          {d}
        </div>
      ))}
      {Array.from({ length: firstDayOfMonth }).map((_, i) => {
        const paddingDate = new Date(calYear, calMonth - 1, 1 - (firstDayOfMonth - i));
        return <div key={paddingDate.toISOString()} />;
      })}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const dayNum = i + 1;
        const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        const dayData = calendar?.find((d) => d.date === dateStr);
        const status = dayData?.status || 'not_marked';
        const isToday = dateStr === today.toISOString().split('T')[0];

        return (
          <div
            key={dayNum}
            className={`group relative flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-all ${getStatusColor(status)} ${isToday ? 'ring-2 ring-pink-400 ring-offset-1' : ''}`}
            title={dayData?.holiday_name || status.replace('_', ' ')}
          >
            {dayNum}
            {status !== 'not_marked' && status !== 'weekend' && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm opacity-0 transition-opacity group-hover:opacity-100">
                {getStatusEmoji(status)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentAttendancePage() {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary();
  const { data: calendar, isLoading: calendarLoading } = useAttendanceCalendar(calYear, calMonth);
  const { data: yearly, isLoading: yearlyLoading } = useYearlyReport();

  const goToPrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };
  const goToNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(calYear, calMonth - 1, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track your daily attendance and progress 🌱"
        icon={CalendarCheck}
      />

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AttendanceSummaryStats isLoading={summaryLoading} summary={summary} />
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">
                📅 {MONTH_NAMES[calMonth - 1]} {calYear}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-emerald-400" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-red-400" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-amber-400" /> Half Day
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-sky-200" /> Holiday
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <AttendanceCalendarGrid
              isLoading={calendarLoading}
              calYear={calYear}
              calMonth={calMonth}
              firstDayOfMonth={firstDayOfMonth}
              daysInMonth={daysInMonth}
              calendar={calendar}
              today={today}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Yearly Report */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-lg font-semibold text-gray-700">
              📊 Yearly Progress{' '}
              {yearly?.academic_year?.name ? `(${yearly.academic_year.name})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              if (yearlyLoading) {
                return <Skeleton className="h-48 w-full rounded-xl" />;
              }
              if (yearly?.months && yearly.months.length > 0) {
                return (
                  <div className="space-y-3">
                    {yearly.months.map((m) => (
                      <div key={`${m.year}-${m.month_number}`} className="flex items-center gap-3">
                        <span className="w-12 text-xs font-medium text-gray-500">
                          {m.month_name.slice(0, 3)}
                        </span>
                        <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {m.percentage.toFixed(0)}%
                          </span>
                        </div>
                        <span className="w-16 text-right text-xs text-gray-400">
                          {m.present_days}/{m.working_days}
                        </span>
                      </div>
                    ))}
                    {/* Total */}
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm font-semibold text-gray-700">
                        Overall: {yearly.total_summary.overall_percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        ({yearly.total_summary.total_present_days}/
                        {yearly.total_summary.total_working_days} days)
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-4xl">🌱</span>
                  <p className="text-sm text-gray-500">
                    No attendance data yet for this academic year
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  emoji,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly emoji: string;
}) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg bg-gradient-to-br ${color} p-2 text-white shadow-md`}>
            {icon}
          </div>
          <span className="text-xl opacity-60 transition-transform group-hover:scale-125">
            {emoji}
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </CardContent>
      <div
        className={`absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10`}
      />
    </Card>
  );
}
