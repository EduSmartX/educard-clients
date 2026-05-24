/**
 * Employee Dashboard Page
 *
 * Motion-rich dashboard for teachers/staff with:
 * - Animated greeting banner with breathing orbs
 * - Staggered stat card reveals with hover interactions
 * - Today's classes from timetable API with animated list
 * - Leave balance, pending timesheets, attendance donut chart
 */

import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  CalendarDays,
  ArrowRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useMyTimetable } from '@/features/timetable/hooks/queries';
import { useMyLeaveBalancesSummary } from '@/features/leave/hooks/use-leave-balances';
import { useTimesheetSubmissions } from '@/features/attendance/hooks';
import { useEmployeeAttendance } from '@/features/attendance/hooks/queries/use-employee-attendance';
import { useAuth } from '@/hooks/use-auth';
import { DAY_LABELS, type TimetableEntry } from '@/features/timetable/types';
import { getSubjectColor } from '@/constants/subject-colors';

const STAGGER_CHILDREN = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
} as const;

function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) {
    return { text: 'Good Morning', emoji: '☀️' };
  }
  if (h < 17) {
    return { text: 'Good Afternoon', emoji: '🌤️' };
  }
  return { text: 'Good Evening', emoji: '🌙' };
}

function SectionHeader({
  icon: Icon,
  title,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="mb-4 flex items-center gap-2"
    >
      <Icon className="h-5 w-5 text-blue-600" />
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </motion.div>
  );
}

function AnimatedNumber({ value, isLoading }: { value: number; isLoading: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  if (isLoading) {
    return <Skeleton className="h-8 w-16" />;
  }

  return (
    <motion.span
      ref={ref}
      className="text-2xl font-bold"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
    >
      {value}
    </motion.span>
  );
}

const DONUT_SEGMENTS = [
  {
    key: 'present',
    label: 'Present',
    color: '#22c55e',
    dotClass: 'bg-green-500',
    borderClass: 'border-green-200',
    bgClass: 'bg-green-50',
    textClass: 'text-green-700',
    boldClass: 'text-green-800',
  },
  {
    key: 'absent',
    label: 'Absent',
    color: '#ef4444',
    dotClass: 'bg-red-500',
    borderClass: 'border-red-200',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    boldClass: 'text-red-800',
  },
  {
    key: 'leaves',
    label: 'Leave',
    color: '#f97316',
    dotClass: 'bg-orange-500',
    borderClass: 'border-orange-200',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    boldClass: 'text-orange-800',
  },
  {
    key: 'holidays',
    label: 'Holiday',
    color: '#a855f7',
    dotClass: 'bg-purple-500',
    borderClass: 'border-purple-200',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    boldClass: 'text-purple-800',
  },
] as const;

/** Format time string (HH:MM) to 12-hour format */
function formatTime(timeStr: string): string {
  if (!timeStr) {
    return '';
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'Teacher';

  const { data: timetableData, isLoading: loadingTimetable } = useMyTimetable();
  const { data: leaveData, isLoading: loadingLeave } = useMyLeaveBalancesSummary();
  const { data: timesheetData, isLoading: loadingTimesheet } = useTimesheetSubmissions({
    status: 'DRAFT,RETURNED',
  });

  const currentMonthRange = useMemo(() => {
    const now = new Date();
    return {
      from_date: format(startOfMonth(now), 'yyyy-MM-dd'),
      to_date: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  }, []);

  const { data: attendanceData, isLoading: loadingAttendance } = useEmployeeAttendance(
    currentMonthRange,
    true
  );

  const todayDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const todayClasses = useMemo((): TimetableEntry[] => {
    if (!timetableData?.days) {
      return [];
    }
    const entries =
      timetableData.days[todayDayNum] || timetableData.days[String(todayDayNum)] || [];
    return [...entries].sort((a, b) => {
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      return timeA.localeCompare(timeB);
    });
  }, [timetableData, todayDayNum]);

  const nextClass = useMemo((): TimetableEntry | undefined => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    return todayClasses.find((entry) => {
      const [hours, minutes] = (entry.start_time || '00:00').split(':').map(Number);
      return hours * 60 + minutes > currentTime;
    });
  }, [todayClasses]);

  const totalLeaveBalance = useMemo(() => {
    if (!leaveData?.data) {
      return 0;
    }
    return leaveData.data.reduce((sum, balance) => sum + (balance.available || 0), 0);
  }, [leaveData]);

  const pendingTimesheets = useMemo(() => {
    return timesheetData?.results?.length || 0;
  }, [timesheetData]);

  const attendanceStats = useMemo(() => {
    const stats = attendanceData?.stats || {};
    const present = stats.total_present || 0;
    const absent = stats.total_absent || 0;
    const leaves = stats.total_leaves || 0;
    const holidays = stats.total_holidays || 0;
    const total = present + absent + leaves + holidays;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leaves, holidays, total, percentage };
  }, [attendanceData]);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-3 py-4 sm:p-6">
      {/* Animated Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-2xl shadow-blue-500/20 sm:p-8"
      >
        <motion.div
          className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.05, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4 text-white/60" />
            <span className="text-sm font-medium text-white/70">{formattedDate}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {greeting.text}, {firstName}! {greeting.emoji}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-1.5 text-sm text-white/75 sm:text-base"
          >
            Here&apos;s what&apos;s happening today
          </motion.p>

          {nextClass ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm"
            >
              <Calendar className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-medium">
                Next class: {formatTime(nextClass.start_time)} — {nextClass.subject_name}
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">
                {todayClasses.length > 0
                  ? 'All classes completed for today!'
                  : 'No classes scheduled today'}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <section>
        <SectionHeader icon={BarChart3} title="Overview" delay={0.2} />
        <motion.div
          variants={STAGGER_CHILDREN}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-3"
        >
          {/* My Classes Today */}
          <motion.div
            variants={FADE_UP}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => navigate('/timetable')}
          >
            <Card className="relative overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/90 to-indigo-600/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <CardContent className="relative z-10 p-5">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 transition-transform duration-300 group-hover:scale-110">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-white/80">
                      My Classes Today
                    </p>
                    <div className="transition-colors duration-300 group-hover:text-white">
                      <AnimatedNumber value={todayClasses.length} isLoading={loadingTimetable} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Leave Balance */}
          <motion.div
            variants={FADE_UP}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => navigate('/leave/requests/new')}
          >
            <Card className="relative overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <CardContent className="relative z-10 p-5">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 transition-transform duration-300 group-hover:scale-110">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-white/80">
                      Leave Balance
                    </p>
                    <div className="transition-colors duration-300 group-hover:text-white">
                      <AnimatedNumber value={totalLeaveBalance} isLoading={loadingLeave} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Tasks */}
          <motion.div
            variants={FADE_UP}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => navigate('/employee/attendance/timesheet')}
          >
            <Card className="relative overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/90 to-amber-600/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <CardContent className="relative z-10 p-5">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-3 transition-transform duration-300 group-hover:scale-110">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-white/80">
                      Pending Tasks
                    </p>
                    <div className="transition-colors duration-300 group-hover:text-white">
                      <AnimatedNumber value={pendingTimesheets} isLoading={loadingTimesheet} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Two-Column Layout: Schedule + Attendance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-6 lg:col-span-2"
        >
          {/* Today's Schedule */}
          <Card className="overflow-hidden border border-gray-100 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 text-cyan-900">
                <Calendar className="h-5 w-5" />
                Today&apos;s Schedule — {DAY_LABELS[todayDayNum]}
              </CardTitle>
              <CardDescription>
                {loadingTimetable && 'Loading...'}
                {!loadingTimetable &&
                  todayClasses.length > 0 &&
                  `${todayClasses.length} class${todayClasses.length > 1 ? 'es' : ''} scheduled`}
                {!loadingTimetable && todayClasses.length === 0 && 'No classes scheduled for today'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {loadingTimetable && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              )}
              {!loadingTimetable && todayClasses.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <Calendar className="mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-500">No classes scheduled for today</p>
                </motion.div>
              )}
              {!loadingTimetable && todayClasses.length > 0 && (
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {todayClasses.map((entry, idx) => {
                    const isNext = nextClass?.public_id === entry.public_id;
                    const [hours] = (entry.start_time || '00:00').split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const subjectColor = getSubjectColor(
                      entry.subject_name || entry.slot_label || 'default'
                    );

                    return (
                      <motion.div
                        key={entry.public_id || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx, duration: 0.4 }}
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                          isNext
                            ? 'border-cyan-300 bg-cyan-50 shadow-sm shadow-cyan-100'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        <div
                          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                          style={{
                            background: `linear-gradient(135deg, ${subjectColor.hex}, ${subjectColor.hex}cc)`,
                          }}
                        >
                          <span className="text-xs font-medium">
                            {displayHours}:{(entry.start_time || '00:00').split(':')[1]}
                          </span>
                          <span className="text-[10px]">{period}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {entry.subject_name || entry.slot_label}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {entry.class_name}
                            {entry.room && ` • Room ${entry.room}`}
                          </p>
                          {isNext && (
                            <Badge
                              variant="secondary"
                              className="mt-1 bg-cyan-100 text-xs text-cyan-700"
                            >
                              Next Class
                            </Badge>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Timesheets */}
          {pendingTimesheets > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="overflow-hidden border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <FileText className="h-5 w-5" />
                    Pending Timesheet Submissions
                  </CardTitle>
                  <CardDescription>
                    {pendingTimesheets} timesheet{pendingTimesheets > 1 ? 's' : ''} waiting for
                    submission
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                    {timesheetData?.results?.map((submission, idx) => (
                      <motion.div
                        key={submission.public_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx, duration: 0.4 }}
                        whileHover={{ x: 4 }}
                        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all hover:shadow-sm"
                      >
                        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Week: {new Date(submission.week_start_date).toLocaleDateString()} –{' '}
                            {new Date(submission.week_end_date).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Status:{' '}
                            {submission.submission_status === 'DRAFT'
                              ? 'Not submitted'
                              : 'Returned'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => navigate('/employee/attendance/timesheet')}
                        >
                          Submit
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <SectionHeader icon={TrendingUp} title="Quick Actions" delay={0.5} />
            <motion.div
              variants={STAGGER_CHILDREN}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-3"
            >
              {[
                {
                  label: 'View Timetable',
                  path: '/timetable',
                  iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
                  icon: Calendar,
                },
                {
                  label: 'Mark Attendance',
                  path: '/employee/attendance/mark',
                  iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
                  icon: TrendingUp,
                },
                {
                  label: 'Apply for Leave',
                  path: '/leave/requests/new',
                  iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
                  icon: CalendarDays,
                },
              ].map((action) => (
                <motion.div
                  key={action.label}
                  variants={FADE_UP}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className="group cursor-pointer"
                >
                  <Card className="border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`shrink-0 rounded-xl p-2.5 ${action.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                        >
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                          {action.label}
                        </span>
                        <ArrowRight className="ml-auto h-4 w-4 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Column — Attendance Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-1"
        >
          <Card className="sticky top-4 overflow-hidden border border-gray-100 shadow-sm transition-shadow hover:shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 pb-3">
              <CardTitle className="text-base font-semibold">Attendance Distribution</CardTitle>
              <p className="text-xs text-gray-600">
                Current Month • Overall:{' '}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="font-semibold text-violet-700"
                >
                  {attendanceStats.percentage}%
                </motion.span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-4">
              {loadingAttendance && <Skeleton className="h-48 w-48 rounded-full" />}
              {!loadingAttendance && attendanceStats.total === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-48 items-center justify-center text-gray-400"
                >
                  No attendance data
                </motion.div>
              )}
              {!loadingAttendance && attendanceStats.total > 0 && (
                <>
                  {/* Animated Donut Chart */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, duration: 0.8, type: 'spring', bounce: 0.2 }}
                    className="relative mb-4 h-48 w-48"
                  >
                    <svg viewBox="0 0 100 100" className="-rotate-90 transform">
                      {(() => {
                        const { present, absent, leaves, holidays, total } = attendanceStats;
                        const circumference = 2 * Math.PI * 40;
                        let offset = 0;

                        const segments = [
                          { value: present, color: '#22c55e' },
                          { value: absent, color: '#ef4444' },
                          { value: leaves, color: '#f97316' },
                          { value: holidays, color: '#a855f7' },
                        ];

                        return segments.map((seg, _idx) => {
                          if (seg.value === 0) {
                            return null;
                          }
                          const length = (seg.value / total) * circumference;
                          const currentOffset = offset;
                          offset += length;
                          return (
                            <circle
                              key={seg.color}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={seg.color}
                              strokeWidth="20"
                              strokeDasharray={`${length} ${circumference - length}`}
                              strokeDashoffset={-currentOffset}
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring', bounce: 0.3 }}
                        className="text-3xl font-bold"
                      >
                        {attendanceStats.percentage}%
                      </motion.span>
                      <span className="text-xs text-gray-500">Present</span>
                    </div>
                  </motion.div>

                  {/* Legend */}
                  <div className="w-full space-y-2">
                    {DONUT_SEGMENTS.map((seg, idx) => (
                      <motion.div
                        key={seg.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.08 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${seg.dotClass}`} />
                          <span className="text-sm">{seg.label}</span>
                        </div>
                        <span className="font-semibold">
                          {attendanceStats[seg.key as keyof typeof attendanceStats]}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Stats Cards Grid */}
                  <motion.div
                    variants={STAGGER_CHILDREN}
                    initial="hidden"
                    animate="show"
                    className="mt-4 grid w-full grid-cols-2 gap-2"
                  >
                    {DONUT_SEGMENTS.map((seg) => (
                      <motion.div
                        key={seg.key}
                        variants={FADE_UP}
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg border ${seg.borderClass} ${seg.bgClass} p-3 transition-shadow hover:shadow-sm`}
                      >
                        <p className={`text-xs font-medium ${seg.textClass}`}>{seg.label}</p>
                        <p className={`text-xl font-bold ${seg.boldClass}`}>
                          {attendanceStats[seg.key as keyof typeof attendanceStats]}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
