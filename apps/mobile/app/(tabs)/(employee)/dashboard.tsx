/**
 * Employee Dashboard - Premium UI matching Admin Dashboard
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  Bell,
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
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { TodaySchedule, StatsGrid, type StatCardProps } from '@/components/dashboard';
import { useDashboardAttendanceStats, useAttendanceDisplay } from '@/features/attendance/hooks';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useMyTimetable } from '@/features/timetable';
import type { TimetableEntry } from '@/features/timetable';
import { useProfileImageUrl } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';

const { width } = Dimensions.get('window');

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
  route: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'homework',
    title: 'Homework',
    icon: FileText,
    gradient: ['#7c3aed', '#a78bfa'],
    route: '/(shared-screens)/homework',
  },
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    icon: ClipboardCheck,
    gradient: ['#0d9488', '#2dd4bf'],
    route: '/(shared-screens)/attendance/mark',
  },
  {
    id: 'enter-marks',
    title: 'Enter Marks',
    icon: GraduationCap,
    gradient: ['#e11d48', '#fb7185'],
    route: '/(shared-screens)/exams/sessions',
  },
  {
    id: 'my-leaves',
    title: 'My Leaves',
    icon: CalendarDays,
    gradient: ['#10b981', '#6ee7b7'],
    route: '/(shared-screens)/leave/my-requests',
  },
  {
    id: 'my-timesheet',
    title: 'My Timesheet',
    icon: Clock,
    gradient: ['#f59e0b', '#fcd34d'],
    route: '/(shared-screens)/timesheets/my-submissions',
  },
];

export default function EmployeeDashboard() {
  const router = useRouter();
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

  const { data: timetableData, isLoading, refetch: refetchTimetable } = useMyTimetable();
  const { data: studentsData, refetch: refetchStudents } = useStudents({ page_size: 1 });
  const { data: classesData, refetch: refetchClasses } = useClasses({ page_size: 1 });
  const { data: attendanceStats, refetch: refetchAttendance } = useDashboardAttendanceStats();

  const todayDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const todayClasses = useMemo((): TimetableEntry[] => {
    if (!timetableData?.days) return [];
    const entries =
      timetableData.days[todayDayNum] || timetableData.days[String(todayDayNum)] || [];
    return [...entries].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [timetableData, todayDayNum]);

  // Use shared hook for formatting attendance display
  const getAttendanceDisplay = useAttendanceDisplay(attendanceStats);

  // Build stats configuration for Teacher dashboard
  // Shows: Students, Classes, Attendance, My Classes Today
  const statsConfig: StatCardProps[] = useMemo(
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
    [studentsData, classesData, getAttendanceDisplay, todayClasses.length]
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#10b981', '#14b8a6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View entering={FadeIn.delay(100).duration(800)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.circle2} />
        <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.circle3} />

        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(15)}
          style={styles.headerContent}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()} {getGreetingEmoji()}
              </Text>
              <Text style={styles.userName}>
                {user?.full_name ?? user?.first_name ?? 'Teacher'}
              </Text>
              <Text style={styles.roleTag}>{user?.role ?? 'Teacher'}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
                <Bell size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => router.push('/(tabs)/(employee)/settings')}
                activeOpacity={0.8}
              >
                {profileImageUrl && !imgError ? (
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.profileImage}
                    contentFit="cover"
                    transition={200}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View style={styles.profileFallback}>
                    <Text style={styles.fallbackText}>
                      {(user?.full_name ?? user?.first_name ?? 'T').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Stats Grid - uses shared component */}
        <StatsGrid stats={statsConfig} />

        {/* Today's Schedule - uses shared component */}
        <TodaySchedule timetableData={timetableData} isLoading={isLoading} />

        <Animated.View
          entering={FadeInDown.delay(500).springify().damping(15)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Star size={16} color="#10b981" />
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={ZoomIn.delay(550 + index * 60)
                  .springify()
                  .damping(14)}
                style={styles.quickActionItem}
              >
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => router.push(action.route as never)}
                  activeOpacity={0.75}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.quickActionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <action.icon size={22} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle3: {
    position: 'absolute',
    top: 30,
    left: width * 0.4,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: { zIndex: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  roleTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  profileImage: { width: 40, height: 40, borderRadius: 12 },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', letterSpacing: -0.3 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  quickActionItem: { width: '50%', padding: 6 },
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
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
