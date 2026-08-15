/**
 * Admin Dashboard Page
 *
 * Motion-rich dashboard with animated counters, staggered card reveals,
 * gradient greeting banner, and hover micro-interactions.
 */

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ContactSupportCard, GreetingAvatar } from '@/components/common';
import {
  Users,
  GraduationCap,
  BookOpen,
  School,
  Sliders,
  CalendarCheck,
  Bell,
  ClipboardCheck,
  ArrowRight,
  Plus,
  Settings,
  BarChart3,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationBanner } from '@/components/dashboard';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/constants/app-config';
import { useQuery } from '@tanstack/react-query';
import { useTeachers } from '@/features/teachers/hooks/use-teachers';
import { useStudents } from '@/features/students/hooks/use-students';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { getDashboardAttendanceStats } from '@/features/attendance/api/attendance-api';

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

function AnimatedNumber({
  value,
  isLoading,
  suffix = '',
}: {
  value: number | undefined;
  isLoading: boolean;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  if (isLoading) {
    return <Loader2 className="mt-1 h-6 w-6 animate-spin text-gray-300" />;
  }

  // Handle undefined/null values explicitly
  const displayValue = value ?? 0;

  // Always animate when value is available, don't wait for scroll
  const shouldAnimate = displayValue !== undefined;

  return (
    <motion.span
      ref={ref}
      className="text-3xl font-bold tracking-tight text-gray-900"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={shouldAnimate || isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
    >
      {displayValue}
      {suffix}
    </motion.span>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  isLoading: boolean;
  gradient: string;
  iconBg: string;
  path: string;
  delay?: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  gradient,
  iconBg,
  path,
  delay = 0,
}: StatCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={FADE_UP}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, delay }}
      onClick={() => navigate(path)}
      className="group cursor-pointer"
    >
      <Card className="relative overflow-hidden border border-gray-100 shadow-sm transition-shadow duration-300 hover:shadow-xl">
        <div
          className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${gradient}`}
        />
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center gap-4">
            <div
              className={`shrink-0 rounded-xl p-3 ${iconBg} transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-white/80">
                {label}
              </p>
              <div className="transition-colors duration-300 group-hover:text-white">
                <AnimatedNumber value={value} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ActionCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  iconBg: string;
}

function ActionCard({ icon: Icon, label, description, path, iconBg }: Readonly<ActionCardProps>) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={FADE_UP}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      className="group cursor-pointer"
    >
      <Card className="border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 rounded-xl p-3 ${iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-teal-700">
                {label}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-teal-500" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface NotificationCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  badgeColor: string;
  delay?: number;
}

function NotificationCard({
  icon: Icon,
  label,
  description,
  path,
  badgeColor,
  delay = 0,
}: NotificationCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ x: 4 }}
      onClick={() => navigate(path)}
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-gray-200 hover:shadow-md"
    >
      <motion.div className={`rounded-full p-2.5 ${badgeColor}`} whileHover={{ scale: 1.1 }}>
        <Icon className="h-5 w-5 text-white" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 transition-colors group-hover:text-teal-700">
          {label}
        </p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-teal-500" />
    </motion.div>
  );
}

function AttendanceCard({
  icon: Icon,
  label,
  isLoading,
  stats,
  iconBg,
  badgeBg,
  path,
  isHoliday,
  holidayName,
  isWorkingDay,
}: {
  icon: React.ElementType;
  label: string;
  isLoading: boolean;
  stats:
    | {
        present?: number;
        total_registered?: number;
        marked?: number;
        attendance_percentage?: number | null;
      }
    | undefined;
  iconBg: string;
  badgeBg: string;
  path: string;
  isHoliday?: boolean;
  holidayName?: string | null;
  isWorkingDay?: boolean;
}) {
  const navigate = useNavigate();
  const marked = stats?.marked ?? 0;

  // Determine what to display
  const getDisplayContent = () => {
    if (isHoliday) {
      return {
        mainText: holidayName || 'Holiday',
        subText: 'No attendance today',
        showPercentage: false,
      };
    }
    if (isWorkingDay === false) {
      return {
        mainText: 'Off Day',
        subText: 'Non-working day',
        showPercentage: false,
      };
    }
    if (marked > 0) {
      return {
        mainText: `${stats?.present ?? 0}`,
        subText: ` / ${stats?.total_registered ?? 0}`,
        showPercentage: true,
        percentage: stats?.attendance_percentage,
      };
    }
    return {
      mainText: 'Not marked yet',
      subText: null,
      showPercentage: false,
    };
  };

  const displayContent = getDisplayContent();

  return (
    <motion.div
      variants={FADE_UP}
      whileHover={{ y: -3 }}
      className="group cursor-pointer"
      onClick={() => navigate(path)}
    >
      <Card className="border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`shrink-0 rounded-xl p-3 ${iconBg} transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                {isLoading && <Loader2 className="mt-1 h-5 w-5 animate-spin text-gray-300" />}
                {!isLoading && (isHoliday || isWorkingDay === false) && (
                  <div>
                    <p className="text-lg font-semibold text-amber-600">
                      {displayContent.mainText}
                    </p>
                    <p className="text-xs text-gray-400">{displayContent.subText}</p>
                  </div>
                )}
                {!isLoading && !(isHoliday || isWorkingDay === false) && marked > 0 && (
                  <p className="text-xl font-bold text-gray-900">
                    {displayContent.mainText}
                    <span className="text-sm font-normal text-gray-400">
                      {displayContent.subText}
                    </span>
                  </p>
                )}
                {!isLoading && !(isHoliday || isWorkingDay === false) && marked <= 0 && (
                  <p className="mt-0.5 text-sm text-gray-400">{displayContent.mainText}</p>
                )}
              </div>
            </div>
            {!isLoading && displayContent.showPercentage && displayContent.percentage !== null && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${badgeBg}`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {displayContent.percentage ?? 0}%
              </motion.span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
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
      <Icon className="h-5 w-5 text-teal-600" />
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';
  const greeting = getGreeting();

  const handleVerifyEmail = () => navigate(`${ROUTES.PROFILE}?tab=email&from=dashboard`);
  const handleVerifyPhone = () => navigate(`${ROUTES.PROFILE}?tab=phone&from=dashboard`);

  const { data: teachersData, isLoading: loadingTeachers } = useTeachers({
    page_size: 1,
    is_deleted: false,
  });
  const { data: studentsData, isLoading: loadingStudents } = useStudents({ page_size: 1 });
  const { data: classesData, isLoading: loadingClasses } = useClasses({ page_size: 1 });

  const { data: attendanceStats, isLoading: loadingAttendance } = useQuery({
    queryKey: ['dashboard', 'attendance-stats'],
    queryFn: getDashboardAttendanceStats,
    staleTime: 30 * 1000, // 30 seconds — dashboard should show near-real-time data
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const totalTeachers = teachersData?.pagination?.count ?? teachersData?.data?.length;
  const totalStudents = studentsData?.pagination?.count ?? studentsData?.data?.length;
  const totalClasses = classesData?.pagination?.count ?? classesData?.data?.length;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-3 py-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 p-6 text-white shadow-2xl shadow-teal-500/20 sm:p-8"
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

        <GreetingAvatar
          name={firstName}
          className="absolute top-5 right-5 z-20 sm:top-7 sm:right-7"
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
            {organization?.name ? `Managing ${organization.name}` : "Here's your school overview"}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-4 flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">Everything is running smoothly today</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Verification Banner */}
      {user && (
        <VerificationBanner
          user={user}
          onVerifyEmail={handleVerifyEmail}
          onVerifyPhone={handleVerifyPhone}
        />
      )}

      <section>
        <SectionHeader icon={BarChart3} title="Statistics" delay={0.2} />
        <motion.div
          variants={STAGGER_CHILDREN}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-3"
        >
          <StatCard
            icon={Users}
            label="Total Teachers"
            value={totalTeachers}
            isLoading={loadingTeachers}
            gradient="bg-gradient-to-br from-blue-500/90 to-indigo-600/90"
            iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
            path={ROUTES.TEACHERS}
          />
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={totalStudents}
            isLoading={loadingStudents}
            gradient="bg-gradient-to-br from-emerald-500/90 to-teal-600/90"
            iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            path={ROUTES.STUDENTS}
          />
          <StatCard
            icon={School}
            label="Total Classes"
            value={totalClasses}
            isLoading={loadingClasses}
            gradient="bg-gradient-to-br from-violet-500/90 to-purple-600/90"
            iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
            path={ROUTES.CLASSES}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4"
        >
          <p className="mb-3 text-sm font-medium text-gray-500">Today's Attendance</p>
          <motion.div
            variants={STAGGER_CHILDREN}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2"
          >
            <AttendanceCard
              icon={GraduationCap}
              label="Student Attendance"
              isLoading={loadingAttendance}
              stats={attendanceStats?.students}
              iconBg="bg-gradient-to-br from-green-500 to-emerald-600"
              badgeBg="bg-green-50 text-green-700"
              path={ROUTES.ATTENDANCE.SUMMARY}
              isHoliday={attendanceStats?.is_holiday}
              holidayName={attendanceStats?.holiday_name}
              isWorkingDay={attendanceStats?.is_working_day}
            />
            <AttendanceCard
              icon={Users}
              label="Employee Attendance"
              isLoading={loadingAttendance}
              stats={attendanceStats?.employees}
              iconBg="bg-gradient-to-br from-cyan-500 to-blue-600"
              badgeBg="bg-cyan-50 text-cyan-700"
              path={ROUTES.ATTENDANCE.REPORT}
              isHoliday={attendanceStats?.is_holiday}
              holidayName={attendanceStats?.holiday_name}
              isWorkingDay={attendanceStats?.is_working_day}
            />
          </motion.div>
        </motion.div>
      </section>

      <section>
        <SectionHeader icon={Plus} title="Quick Actions" delay={0.5} />
        <motion.div
          variants={STAGGER_CHILDREN}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-2"
        >
          <ActionCard
            icon={Users}
            label="Teachers"
            description="Add and manage teaching staff"
            path={ROUTES.TEACHERS}
            iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <ActionCard
            icon={School}
            label="Classes"
            description="Create and organize classes"
            path={ROUTES.CLASSES}
            iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
          />
          <ActionCard
            icon={GraduationCap}
            label="Students"
            description="Enroll and manage students"
            path={ROUTES.STUDENTS}
            iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <ActionCard
            icon={BookOpen}
            label="Subjects"
            description="Configure curriculum subjects"
            path={ROUTES.SUBJECTS}
            iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
          />
        </motion.div>
      </section>

      <section>
        <SectionHeader icon={Settings} title="Setup" delay={0.6} />
        <motion.div
          variants={STAGGER_CHILDREN}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-2"
        >
          <ActionCard
            icon={Sliders}
            label="Organization Preferences"
            description="Configure school settings and policies"
            path={ROUTES.PREFERENCES}
            iconBg="bg-gradient-to-br from-slate-500 to-slate-700"
          />
          <ActionCard
            icon={CalendarCheck}
            label="Leave Policies"
            description="Set up leave types and quotas"
            path={ROUTES.LEAVE.ALLOCATIONS}
            iconBg="bg-gradient-to-br from-teal-500 to-cyan-600"
          />
        </motion.div>
      </section>

      <section>
        <SectionHeader icon={Bell} title="Notifications" delay={0.7} />
        <div className="space-y-3">
          <NotificationCard
            icon={ClipboardCheck}
            label="Leave Requests"
            description="Review and approve pending leave applications"
            path={ROUTES.LEAVE.REVIEWS}
            badgeColor="bg-gradient-to-br from-orange-500 to-amber-600"
            delay={0.75}
          />
          <NotificationCard
            icon={ClipboardCheck}
            label="Timesheet Submissions"
            description="Review and approve submitted employee timesheets"
            path={ROUTES.ATTENDANCE.TIMESHEET_APPROVALS}
            badgeColor="bg-gradient-to-br from-blue-500 to-indigo-600"
            delay={0.85}
          />
          <NotificationCard
            icon={CreditCard}
            label="Fee Payments"
            description="View and manage all student fee payment transactions"
            path={ROUTES.FEES.PAYMENTS}
            badgeColor="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={0.95}
          />
        </div>
      </section>

      <ContactSupportCard className="mt-6" />
    </div>
  );
}
