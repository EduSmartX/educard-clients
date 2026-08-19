/**
 * Parent Dashboard
 * Real-data overview for a student/parent: attendance, fees, marks and schedule.
 */

import { useNavigation } from '@react-navigation/native';
import {
  Award,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
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
  StatusBar,
  StyleSheet,
} from 'react-native';

import {
  BarChart,
  ChartLegend,
  DonutChart,
  type BarDatum,
  type ChartSegment,
} from '@/components/charts';
import { VerificationBanner } from '@/components/dashboard';
import {
  GradientHeader,
  GreetingCard,
  FloatingCard,
  SectionHeader,
  PressableScale,
} from '@/components/ui';
import { colors } from '@/constants/colors';
import { getSubjectVisual } from '@/constants/subject-visuals';
import { useAnnouncements } from '@/features/announcements';
import {
  useAttendanceSummary,
  useExamSessionDetail,
  useExamSessions,
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

function formatAnnouncementDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
  const { data: sessions, refetch: refetchSessions } = useExamSessions();
  const { data: timetable, refetch: refetchTimetable } = useTimetable(today);
  const {
    data: announcements,
    isLoading: annLoading,
    refetch: refetchAnnouncements,
  } = useAnnouncements();

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
      refetchSessions(),
      refetchTimetable(),
      refetchAnnouncements(),
    ]);
    setRefreshing(false);
  }, [
    refetchDashboard,
    refetchAttendance,
    refetchSessions,
    refetchTimetable,
    refetchAnnouncements,
  ]);

  const goToNotifications = () => navigation.navigate('Notifications');
  const goToSettings = () => navigation.navigate('Settings');
  const goToAcademics = () => navigation.navigate('Academics');
  const goToAttendance = () => navigation.navigate('Attendance');
  const goToAnnouncements = () => navigation.navigate('Announcements');
  const goToAnnouncementDetail = (publicId: string) =>
    navigation.navigate('AnnouncementDetail', { publicId });

  // The recipient feed is already sent-only and newest-first from the server.
  const latestAnnouncements = useMemo(
    () => (announcements?.pages.flatMap(page => page.items) ?? []).slice(0, 3),
    [announcements],
  );

  const studentName = user?.full_name ?? 'Student';
  const className = user?.class_name ?? '';

  const attendanceStats = attendance?.current_month;
  const attendanceSegments: ChartSegment[] = attendanceStats
    ? [
        {
          label: 'Present',
          value: Number(attendanceStats.present_days) || 0,
          color: '#10b981',
        },
        {
          label: 'Absent',
          value: Number(attendanceStats.absent_days) || 0,
          color: '#ef4444',
        },
        {
          label: 'Half Day',
          value: Number(attendanceStats.half_days) || 0,
          color: '#f59e0b',
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Fixed hero header — same structure as Admin/Employee dashboards */}
      <GradientHeader
        greeting={`${formatGreeting()},`}
        title={studentName}
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
      >
        {!!className && (
          <View style={styles.classChip}>
            <GraduationCap size={13} color="#fff" />
            <Text style={styles.classChipText}>Class {className}</Text>
          </View>
        )}
      </GradientHeader>

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
        {/* Content */}
        <View className="px-4 pt-4">
          <GreetingCard
            name={studentName.split(' ')[0]}
            subtitle={
              className
                ? `Here is what is happening in Class ${className} today.`
                : 'Here is what is happening at school today.'
            }
            highlight="Keep up the great work!"
          />

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

          {/* Attendance — focused */}
          <View className="mb-10">
            <SectionHeader
              title="Attendance"
              subtitle="This Month"
              icon={ClipboardCheck}
              actionLabel="Details"
              onAction={goToAttendance}
            />
            <FloatingCard>
              {attendanceStats && attendanceStats.working_days > 0 ? (
                <>
                  <View className="items-center">
                    <DonutChart
                      data={attendanceSegments}
                      size={128}
                      thickness={16}
                      centerValue={`${toPercent(attendanceStats.percentage)}%`}
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
          </View>

          {/* Announcements */}
          <View className="mb-10">
            <SectionHeader
              title="Announcements"
              icon={Megaphone}
              actionLabel="View All"
              onAction={goToAnnouncements}
            />
            <FloatingCard>
              {annLoading ? (
                <View className="items-center py-4">
                  <ActivityIndicator color="#059669" />
                </View>
              ) : latestAnnouncements.length > 0 ? (
                latestAnnouncements.map((item, index, arr) => (
                  <PressableScale
                    key={item.public_id}
                    onPress={() => goToAnnouncementDetail(item.public_id)}
                  >
                    <View
                      className={`flex-row items-center py-3 ${
                        index !== arr.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                        <Megaphone size={18} color="#059669" />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-medium text-gray-900"
                          numberOfLines={1}
                        >
                          {item.subject}
                        </Text>
                        <Text
                          className="text-sm text-gray-500"
                          numberOfLines={1}
                        >
                          {item.event_name ||
                            formatAnnouncementDate(item.sent_at)}
                        </Text>
                      </View>
                    </View>
                  </PressableScale>
                ))
              ) : (
                <Text style={styles.emptyText}>No announcements yet</Text>
              )}
            </FloatingCard>
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
                {gradedExams.slice(0, 4).map((mark, index, arr) => {
                  const visual = getSubjectVisual(mark.subject_name);
                  const SubjectIcon = visual.icon;
                  return (
                    <View
                      key={mark.exam_public_id}
                      className={`flex-row items-center py-3 ${
                        index !== arr.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <View
                        style={[
                          styles.subjectAvatar,
                          { backgroundColor: visual.soft },
                        ]}
                      >
                        {visual.image ? (
                          <Image
                            source={visual.image}
                            style={styles.subjectAvatarImage}
                          />
                        ) : (
                          <SubjectIcon size={18} color={visual.text} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          style={[styles.subjectName, { color: visual.text }]}
                        >
                          {mark.subject_name}
                        </Text>
                        {!!mark.grade && (
                          <Text className="text-sm text-gray-500">
                            Grade {mark.grade}
                          </Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text
                          style={[styles.markValue, { color: visual.accent }]}
                        >
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
                  );
                })}
              </FloatingCard>
            </View>
          )}

          {/* Today's Schedule */}
          <View className="mb-10">
            <SectionHeader
              title="Today's Schedule"
              icon={CalendarClock}
              actionLabel="Timetable"
              onAction={goToAcademics}
            />

            <FloatingCard>
              {todaysClasses.length > 0 ? (
                todaysClasses.map((cls, index) => {
                  const visual = getSubjectVisual(cls.subject_name);
                  const SubjectIcon = visual.icon;
                  return (
                    <View
                      key={cls.slot_public_id}
                      className={`flex-row items-center py-3 ${
                        index !== todaysClasses.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <View
                        style={[
                          styles.subjectAvatar,
                          { backgroundColor: visual.soft },
                        ]}
                      >
                        {visual.image ? (
                          <Image
                            source={visual.image}
                            style={styles.subjectAvatarImage}
                          />
                        ) : (
                          <SubjectIcon size={18} color={visual.text} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          style={[styles.subjectName, { color: visual.text }]}
                        >
                          {cls.subject_name}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {cls.start_time} - {cls.end_time}
                          {cls.teacher_name
                            ? ` \u2022 ${cls.teacher_name}`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No classes scheduled today</Text>
              )}
            </FloatingCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
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
  classChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  classChipText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  subjectAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subjectAvatarImage: { width: 22, height: 22, borderRadius: 6 },
  subjectName: { fontSize: 14, fontWeight: '700' },
  markValue: { fontSize: 17, fontWeight: '800' },
});
