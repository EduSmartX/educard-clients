/**
 * Student Dashboard Page
 *
 * Landing page for the dedicated Student Portal (`/student/dashboard`).
 * Shows attendance %, today's timetable, and pending homework/exam counts
 * pulled from `GET /students/student/dashboard/`.
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarClock,
  Clock,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationBanner } from '@/components/dashboard';
import { useAuth } from '@/hooks/use-auth';
import { useStudentDashboard } from '../hooks/use-dashboard-data';

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

/** Format a "HH:MM" (or "HH:MM:SS") time string to 12-hour format. */
function formatTime(timeStr: string): string {
  if (!timeStr) {
    return '';
  }
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function AnimatedNumber({ value, isLoading }: { value: number | string; isLoading: boolean }) {
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

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  const { data, isLoading, isError } = useStudentDashboard();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stats = [
    {
      label: 'Attendance This Month',
      value: isLoading ? '' : `${data?.attendance.current_month_percentage ?? 0}%`,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      gradient: 'bg-gradient-to-br from-emerald-500/90 to-teal-600/90',
      icon: BarChart3,
    },
    {
      label: 'Attendance This Year',
      value: isLoading ? '' : `${data?.attendance.academic_year_percentage ?? 0}%`,
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      gradient: 'bg-gradient-to-br from-blue-500/90 to-indigo-600/90',
      icon: CalendarClock,
    },
    {
      label: 'Pending Homework',
      value: isLoading ? '' : (data?.pending_homework_count ?? 0),
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      gradient: 'bg-gradient-to-br from-orange-500/90 to-amber-600/90',
      icon: BookOpen,
    },
    {
      label: 'Upcoming Exams',
      value: isLoading ? '' : (data?.upcoming_exams_count ?? 0),
      iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      gradient: 'bg-gradient-to-br from-violet-500/90 to-purple-600/90',
      icon: FileWarning,
    },
  ];

  const todayTimetable = data?.today_timetable ?? [];

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-3 py-4 sm:p-6">
      {/* Verification Banner */}
      {user && <VerificationBanner user={user} />}

      {/* Animated Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-violet-500/20 sm:p-8"
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
            Here&apos;s an overview of your progress
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">Keep up the great work!</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <motion.div
        variants={STAGGER_CHILDREN}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={FADE_UP}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <Card className="relative overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
                <div
                  className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${stat.gradient}`}
                />
                <CardContent className="relative z-10 p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`shrink-0 rounded-xl p-3 ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-white/80">
                        {stat.label}
                      </p>
                      <div className="transition-colors duration-300 group-hover:text-white">
                        <AnimatedNumber value={stat.value} isLoading={isLoading} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Today's Timetable */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-cyan-900">
            <Calendar className="h-5 w-5" />
            Today&apos;s Timetable
          </CardTitle>
          <CardDescription>
            {isLoading && 'Loading...'}
            {!isLoading &&
              !isError &&
              todayTimetable.length > 0 &&
              `${todayTimetable.length} period${todayTimetable.length > 1 ? 's' : ''} scheduled`}
            {!isLoading && !isError && todayTimetable.length === 0 && 'No periods scheduled today'}
            {isError && 'Unable to load your timetable right now'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && todayTimetable.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Calendar className="mb-2 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-500">No periods scheduled today</p>
            </motion.div>
          )}

          {!isLoading && todayTimetable.length > 0 && (
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {todayTimetable.map((entry, idx) => (
                <motion.div
                  key={entry.slot_public_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    entry.is_cancelled
                      ? 'border-red-100 bg-red-50/60'
                      : 'border-gray-100 bg-gray-50/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-gray-900">
                        {entry.subject_name || entry.label}
                      </p>
                      {entry.is_cancelled && (
                        <Badge variant="destructive" className="shrink-0">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {entry.teacher_name || 'No teacher assigned'}
                      {entry.room ? ` • ${entry.room}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-gray-500">
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
