/**
 * Parent Dashboard
 * Real-data overview for a student/parent: attendance, fees, marks and schedule.
 */

import { useNavigation } from '@react-navigation/native';
import {
  Award,
  BookOpen,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  Megaphone,
  Star,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {
  BarChart,
  ChartLegend,
  DonutChart,
  type BarDatum,
  type ChartSegment,
} from '@/components/charts';
import {
  VerificationBanner,
  StatsGrid,
  type StatCardData,
} from '@/components/dashboard';
import { Screen } from '@/components/layout';
import {
  GradientHeader,
  FloatingCard,
  SectionHeader,
  QuickActionsGrid,
  PressableScale,
  type QuickAction,
} from '@/components/ui';
import { colors } from '@/constants/colors';
import {
  useAttendanceSummary,
  useExamSessionDetail,
  useExamSessions,
  useFeeSummary,
  useStudentDashboard,
  useTimetable,
} from '@/features/student-portal';
import { useProfileImageUrl } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import type { ParentTabNavigation } from '@/navigation/types';

function toLocalDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatCurrency(amount: number | string | null | undefined) {
  const n = Number(amount) || 0;
  if (n >= 1000) {
    return `\u20b9${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  }
  return `\u20b9${n}`;
}

// API may return numeric fields as strings or omit them; coerce safely.
function toPercent(value: number | string | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function shortLabel(name: string) {
  return name.length > 6 ? `${name.slice(0, 6)}\u2026` : name;
}

export default function ParentDashboardScreen() {
  const navigation = useNavigation<ParentTabNavigation>();
  const { user } = useAuthStore();
  const { profileImageUrl } = useProfileImageUrl();
  const [imgError, setImgError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const today = useMemo(() => toLocalDateStr(), []);

  const {
    data: dashboard,
    isLoading: dashLoading,
    refetch: refetchDashboard,
  } = useStudentDashboard();
  const { data: attendance, refetch: refetchAttendance } =
    useAttendanceSummary();
  const { data: fee, refetch: refetchFee } = useFeeSummary();
  const { data: sessions, refetch: refetchSessions } = useExamSessions();
  const { data: timetable, refetch: refetchTimetable } = useTimetable(today);

  const latestSessionId = useMemo(() => {
    if (!sessions?.length) return null;
    return [...sessions].sort((a, b) =>
      b.start_date.localeCompare(a.start_date),
    )[0].public_id;
  }, [sessions]);
  const { data: examDetail } = useExamSessionDetail(latestSessionId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchAttendance(),
      refetchFee(),
      refetchSessions(),
      refetchTimetable(),
    ]);
    setRefreshing(false);
  }, [
    refetchDashboard,
    refetchAttendance,
    refetchFee,
    refetchSessions,
    refetchTimetable,
  ]);

  const goToNotifications = () => navigation.navigate('Notifications');
  const goToSettings = () => navigation.navigate('Settings');
  const goToFees = () => navigation.navigate('Fees');
  const goToAcademics = () => navigation.navigate('Academics');
  const goToAttendance = () => navigation.navigate('Attendance');
  const goToAnnouncements = () => navigation.navigate('Announcements');

  const studentName = dashboard?.student_name ?? user?.full_name ?? 'Student';
  const className = dashboard?.class_name ?? '';

  const parentStats: StatCardData[] = [
    {
      id: 'attendance',
      title: 'Attendance',
      value:
        dashboard?.attendance_percentage != null
          ? `${toPercent(dashboard.attendance_percentage)}%`
          : '\u2014',
      icon: ClipboardCheck,
      gradient: ['#10b981', '#059669', '#047857'],
      shadowColor: '#059669',
    },
    {
      id: 'grade',
      title: 'Grade',
      value: examDetail?.overall_grade ?? '\u2014',
      icon: Award,
      gradient: ['#667eea', '#764ba2', '#8b5cf6'],
      shadowColor: '#764ba2',
    },
    {
      id: 'rank',
      title: 'Class Rank',
      value: examDetail?.rank != null ? `#${examDetail.rank}` : '\u2014',
      icon: Star,
      gradient: ['#f59e0b', '#d97706', '#b45309'],
      shadowColor: '#d97706',
    },
    {
      id: 'fees',
      title: fee && Number(fee.balance_due) > 0 ? 'Fees Due' : 'Fees',
      value: fee ? formatCurrency(fee.balance_due) : '\u2014',
      icon: CreditCard,
      gradient: ['#ef4444', '#dc2626', '#b91c1c'],
      shadowColor: '#dc2626',
    },
  ];

  const attendanceSegments: ChartSegment[] = attendance
    ? [
        {
          label: 'Present',
          value: Number(attendance.current_month.present_days) || 0,
          color: '#10b981',
        },
        {
          label: 'Absent',
          value: Number(attendance.current_month.absent_days) || 0,
          color: '#ef4444',
        },
        {
          label: 'Half Day',
          value: Number(attendance.current_month.half_days) || 0,
          color: '#f59e0b',
        },
      ]
    : [];

  const feeSegments: ChartSegment[] = fee
    ? [
        {
          label: 'Paid',
          value: Number(fee.amount_paid) || 0,
          color: '#10b981',
        },
        {
          label: 'Due',
          value: Number(fee.balance_due) || 0,
          color: '#ef4444',
        },
      ]
    : [];

  const gradedExams = (examDetail?.exams ?? []).filter(
    exam =>
      exam.marks_obtained != null &&
      Number(exam.max_marks) > 0 &&
      !exam.is_absent,
  );

  const marksData: BarDatum[] = gradedExams.slice(0, 6).map(exam => {
    const max = Number(exam.max_marks) || 1;
    const pct = Math.round((Number(exam.marks_obtained ?? 0) / max) * 100);
    return {
      label: shortLabel(exam.subject_name),
      value: pct,
      color: pct >= 40 ? '#7c3aed' : '#ef4444',
    };
  });

  const todaysClasses = (timetable ?? [])
    .filter(entry => !entry.is_cancelled && entry.subject_name)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 5);

  const quickActions: QuickAction[] = [
    {
      id: 'attendance',
      title: 'Attendance',
      icon: ClipboardCheck,
      gradient: ['#059669', '#34d399'],
      onPress: goToAttendance,
    },
    {
      id: 'academics',
      title: 'Academics',
      icon: BookOpen,
      gradient: ['#3b82f6', '#60a5fa'],
      onPress: goToAcademics,
    },
    {
      id: 'fees',
      title: 'Pay Fees',
      icon: CreditCard,
      gradient: ['#f59e0b', '#fbbf24'],
      onPress: goToFees,
    },
  ];

  return (
    <Screen scrollable={false} edges={[]} statusBarStyle="light">
      {/* Fixed hero header — same structure as Admin/Employee dashboards */}
      <GradientHeader
        greeting={`${formatGreeting()},`}
        title={studentName}
        subtitle={className ? `Class ${className}` : undefined}
        onNotificationPress={goToNotifications}
        right={
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={goToSettings}
            activeOpacity={0.8}
          >
            {profileImageUrl && !imgError ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.profileImage}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={styles.profileFallback}>
                <Text style={styles.profileFallbackText}>
                  {(studentName ?? 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
          />
        }
      >
        {/* Stats Row */}
        <View style={styles.statsWrap}>
          <StatsGrid stats={parentStats} />
        </View>

        {/* Content */}
        <View className="px-4 pt-4">
          {user && (
            <VerificationBanner
              user={user}
              includeGuardianChecks={false}
              onVerifyEmail={() =>
                navigation.navigate('ChangeEmail', {
                  mode: 'verify',
                  from: 'dashboard',
                })
              }
              onVerifyPhone={() =>
                navigation.navigate('ChangePhone', {
                  mode: 'verify',
                  from: 'dashboard',
                })
              }
            />
          )}

          {dashLoading && !dashboard && (
            <View className="items-center py-8">
              <ActivityIndicator color={colors.primary[500]} />
            </View>
          )}

          {/* Analytics: attendance & fees */}
          <View style={styles.chartsRow}>
            <FloatingCard style={styles.chartCard}>
              <Text style={styles.chartTitle}>Attendance</Text>
              <Text style={styles.chartSubtitle}>This Month</Text>
              {attendance && attendance.current_month.working_days > 0 ? (
                <>
                  <View className="items-center">
                    <DonutChart
                      data={attendanceSegments}
                      size={128}
                      thickness={16}
                      centerValue={`${toPercent(attendance.current_month.percentage)}%`}
                      centerLabel="Present"
                    />
                  </View>
                  <ChartLegend
                    data={attendanceSegments}
                    showValues
                    style={styles.legend}
                  />
                </>
              ) : (
                <Text style={styles.emptyText}>No data yet</Text>
              )}
            </FloatingCard>

            <FloatingCard style={styles.chartCard}>
              <Text style={styles.chartTitle}>Fees</Text>
              {fee && Number(fee.total_amount) > 0 ? (
                <>
                  <View className="items-center">
                    <DonutChart
                      data={feeSegments}
                      size={128}
                      thickness={16}
                      centerValue={`${toPercent(
                        (Number(fee.amount_paid) / Number(fee.total_amount)) *
                          100,
                      )}%`}
                      centerLabel="Paid"
                    />
                  </View>
                  <ChartLegend
                    data={feeSegments}
                    showValues
                    style={styles.legend}
                  />
                </>
              ) : (
                <Text style={styles.emptyText}>No data yet</Text>
              )}
            </FloatingCard>
          </View>

          {/* Announcements */}
          <View className="mb-6">
            <PressableScale
              onPress={goToAnnouncements}
              style={styles.rounded16}
            >
              <View className="flex-row items-center rounded-2xl border border-primary-200 bg-primary-50 p-4">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <Megaphone size={20} color={colors.primary[600]} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-primary-800">
                    Announcements
                  </Text>
                  <Text className="text-sm text-primary-600" numberOfLines={1}>
                    View the latest school announcements
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.primary[400]} />
              </View>
            </PressableScale>
          </View>

          {/* Performance */}
          {marksData.length > 0 && (
            <View className="mb-6">
              <SectionHeader
                title="Performance"
                subtitle={examDetail?.name}
                icon={Award}
                actionLabel="Details"
                onAction={goToAcademics}
              />
              <FloatingCard>
                <BarChart data={marksData} height={130} />
              </FloatingCard>
            </View>
          )}

          {/* Recent Marks */}
          {gradedExams.length > 0 && (
            <View className="mb-6">
              <SectionHeader
                title="Recent Marks"
                icon={BookOpen}
                actionLabel="View All"
                onAction={goToAcademics}
              />

              <FloatingCard>
                {gradedExams.slice(0, 4).map((mark, index, arr) => (
                  <View
                    key={mark.exam_public_id}
                    className={`flex-row items-center py-3 ${
                      index !== arr.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                      <BookOpen size={18} color={colors.primary[600]} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        {mark.subject_name}
                      </Text>
                      {!!mark.grade && (
                        <Text className="text-sm text-gray-500">
                          Grade {mark.grade}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-primary-600">
                        {mark.marks_obtained}/{mark.max_marks}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {Math.round(
                          ((mark.marks_obtained ?? 0) / mark.max_marks) * 100,
                        )}
                        %
                      </Text>
                    </View>
                  </View>
                ))}
              </FloatingCard>
            </View>
          )}

          {/* Today's Schedule */}
          <View className="mb-6">
            <SectionHeader
              title="Today's Schedule"
              icon={CalendarClock}
              actionLabel="Timetable"
              onAction={goToAcademics}
            />

            <FloatingCard>
              {todaysClasses.length > 0 ? (
                todaysClasses.map((cls, index) => (
                  <View
                    key={cls.slot_public_id}
                    className={`flex-row items-center py-3 ${
                      index !== todaysClasses.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                      <Clock size={18} color={colors.primary[600]} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        {cls.subject_name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {cls.start_time} - {cls.end_time}
                        {cls.teacher_name ? ` \u2022 ${cls.teacher_name}` : ''}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No classes scheduled today</Text>
              )}
            </FloatingCard>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <SectionHeader title="Quick Actions" />
            <QuickActionsGrid actions={quickActions} columns={3} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  statsWrap: { marginTop: 12 },
  scrollContent: { paddingBottom: 100 },
  chartsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  chartCard: { flex: 1 },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 8,
  },
  legend: { marginTop: 12 },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  profileImage: { width: 42, height: 42, borderRadius: 14 },
  profileFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileFallbackText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rounded16: { borderRadius: 16 },
});
