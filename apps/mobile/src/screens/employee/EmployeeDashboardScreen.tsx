/**
 * Employee Dashboard — Premium UI matching Admin Dashboard
 */

import { useNavigation } from '@react-navigation/native';
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  GraduationCap,
  CalendarDays,
  Star,
  FileText,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import {
  TodaySchedule,
  StatsGrid,
  VerificationBanner,
  type StatCardData,
} from '@/components/dashboard';
import { GradientHeader, GreetingCard, PressableScale } from '@/components/ui';
import {
  useDashboardAttendanceStats,
  useAttendanceDisplay,
} from '@/features/attendance/hooks';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useMyTimetable } from '@/features/timetable';
import type { TimetableEntry } from '@/features/timetable';
import { useProfileImageUrl } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { EmployeeTabNavigation } from '@/navigation/types';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  return '🌙';
};

interface QuickAction {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  screen: MenuTarget;
}

const quickActions: QuickAction[] = [
  {
    id: 'homework',
    title: 'Homework',
    icon: FileText,
    gradient: ['#7c3aed', '#a78bfa'],
    screen: 'HomeworkList',
  },
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    icon: ClipboardCheck,
    gradient: ['#0d9488', '#2dd4bf'],
    screen: 'AttendanceMark',
  },
  {
    id: 'enter-marks',
    title: 'Enter Marks',
    icon: GraduationCap,
    gradient: ['#e11d48', '#fb7185'],
    screen: 'ExamSessions',
  },
  {
    id: 'my-leaves',
    title: 'My Leaves',
    icon: CalendarDays,
    gradient: ['#10b981', '#6ee7b7'],
    screen: 'LeaveMyRequests',
  },
  {
    id: 'my-timesheet',
    title: 'My Timesheet',
    icon: Clock,
    gradient: ['#f59e0b', '#fcd34d'],
    screen: 'TimesheetMySubmissions',
  },
];

export default function EmployeeDashboardScreen() {
  const navigation = useNavigation<EmployeeTabNavigation>();
  const { width: viewportWidth } = useWindowDimensions();
  const { user } = useAuthStore();
  const { profileImageUrl } = useProfileImageUrl();
  const [refreshing, setRefreshing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const {
    data: timetableData,
    isLoading,
    refetch: refetchTimetable,
  } = useMyTimetable();
  const { data: studentsData, refetch: refetchStudents } = useStudents({
    page_size: 1,
  });
  const { data: classesData, refetch: refetchClasses } = useClasses({
    page_size: 1,
  });
  const { data: attendanceStats, refetch: refetchAttendance } =
    useDashboardAttendanceStats();

  const todayDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const todayClasses = useMemo((): TimetableEntry[] => {
    if (!timetableData?.days) return [];
    const entries =
      timetableData.days[todayDayNum] ||
      timetableData.days[String(todayDayNum)] ||
      [];
    return [...entries].sort((a, b) =>
      (a.start_time || '').localeCompare(b.start_time || ''),
    );
  }, [timetableData, todayDayNum]);

  const getAttendanceDisplay = useAttendanceDisplay(attendanceStats);

  const statsConfig: StatCardData[] = useMemo(
    () => [
      {
        id: 'students',
        title: 'Students',
        value: studentsData?.totalCount?.toLocaleString() ?? '0',
        icon: GraduationCap,
        gradient: ['#667eea', '#764ba2', '#8b5cf6'] as const,
        shadowColor: '#764ba2',
      },
      {
        id: 'classes',
        title: 'Classes',
        value: classesData?.totalCount?.toLocaleString() ?? '0',
        icon: BookOpen,
        gradient: ['#10b981', '#059669', '#047857'] as const,
        shadowColor: '#059669',
      },
      {
        id: 'attendance',
        title: 'Attendance',
        value: getAttendanceDisplay(),
        icon: Clock,
        gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
        shadowColor: '#d97706',
      },
      {
        id: 'my-classes',
        title: 'My Classes Today',
        value: todayClasses.length.toString(),
        icon: CalendarDays,
        gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
        shadowColor: '#0891b2',
      },
    ],
    [studentsData, classesData, getAttendanceDisplay, todayClasses.length],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([
      refetchTimetable(),
      refetchStudents(),
      refetchClasses(),
      refetchAttendance(),
    ]).finally(() => {
      if (isMountedRef.current) setRefreshing(false);
    });
  }, [refetchTimetable, refetchStudents, refetchClasses, refetchAttendance]);

  const goToSettings = () => navigation.navigate('Settings');
  const goToNotifications = () => navigation.navigate('Notifications');

  const handleQuickAction = (screen: MenuTarget) => {
    navigateToScreen(navigation, screen);
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        greeting={`${getGreeting()} ${getGreetingEmoji()}`}
        title={user?.full_name ?? user?.first_name ?? 'Teacher'}
        subtitle={user?.role ?? 'Teacher'}
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
                <Text style={styles.fallbackText}>
                  {(user?.full_name ?? user?.first_name ?? 'T')
                    .charAt(0)
                    .toUpperCase()}
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
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
      >
        <GreetingCard
          name={
            (user?.full_name ?? user?.first_name ?? 'Teacher').split(' ')[0]
          }
          subtitle="Here is your schedule and pending work for today."
          highlight="Have a great teaching day!"
          colors={['#0d9488', '#0891b2', '#2563eb']}
        />

        {user && (
          <VerificationBanner
            user={user}
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

        <StatsGrid stats={statsConfig} />

        <TodaySchedule
          timetableData={timetableData}
          isLoading={isLoading}
          onViewAll={() => navigateToScreen(navigation, 'TimetableTeacher')}
        />

        <Animated.View
          entering={FadeInDown.delay(500).springify().damping(15)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Star size={16} color="#10b981" />
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Animated.View
                  key={action.id}
                  entering={ZoomIn.delay(550 + index * 60)
                    .springify()
                    .damping(14)}
                  style={[
                    styles.quickActionItem,
                    viewportWidth >= 768
                      ? styles.quickActionItemTablet
                      : styles.quickActionItemPhone,
                  ]}
                >
                  <PressableScale
                    style={styles.quickActionCard}
                    onPress={() => handleQuickAction(action.screen)}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.quickActionIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <ActionIcon size={22} color="#fff" strokeWidth={2} />
                    </LinearGradient>
                    <Text style={styles.quickActionLabel}>{action.title}</Text>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  profileImage: { width: 44, height: 44, borderRadius: 14 },
  profileFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  content: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 100 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionItem: { padding: 6 },
  quickActionItemPhone: { width: '50%' },
  quickActionItemTablet: { width: '33.333%' },
  quickActionCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
