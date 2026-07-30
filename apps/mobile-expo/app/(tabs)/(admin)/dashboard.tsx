/**
 * Admin Dashboard — Premium UI
 * Glassmorphism cards, spring animations, vibrant gradients, floating feel
 */

import { getRoleThemeColors } from '@educard/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  CalendarCheck,
  Settings,
  FileText,
  ClipboardList,
  SlidersHorizontal,
  Star,
} from 'lucide-react-native';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import {
  TodaySchedule,
  StatsGrid,
  VerificationBanner,
  type StatCardData,
} from '@/components/dashboard';
import { GradientHeader, PressableScale } from '@/components/ui';
import { getMediaUrl } from '@/constants/config';
import { useDashboardAttendanceStats, useAttendanceDisplay } from '@/features/attendance/hooks';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useTeachers } from '@/features/teachers';
import { useMyTimetable } from '@/features/timetable';
import { useMyProfilePhoto } from '@/hooks';
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

// Theme colors for admin - can be used for future theming
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _adminTheme = getRoleThemeColors('admin');

interface AdminLinkItem {
  id: string;
  title: string;
  icon: typeof Users;
  gradient: readonly [string, string];
  route?: string;
}

const adminLinks: AdminLinkItem[] = [
  {
    id: 'homework',
    title: 'Homework',
    icon: BookOpen,
    gradient: ['#7c3aed', '#a78bfa'],
    route: '/(shared-screens)/homework',
  },
  {
    id: 'leave-allocations',
    title: 'Leave Policy',
    icon: FileText,
    gradient: ['#8b5cf6', '#a78bfa'],
    route: '/(shared-screens)/leave/allocations',
  },
  {
    id: 'org-preferences',
    title: 'Org Prefs',
    icon: SlidersHorizontal,
    gradient: ['#0ea5e9', '#38bdf8'],
    route: '/(shared-screens)/preferences',
  },
  {
    id: 'holiday-calendar',
    title: 'Holidays',
    icon: Calendar,
    gradient: ['#ef4444', '#f87171'],
    route: '/(shared-screens)/holidays',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Appr.',
    icon: CalendarCheck,
    gradient: ['#10b981', '#34d399'],
    route: '/(shared-screens)/leave/approvals',
  },
  {
    id: 'timesheet-approvals',
    title: 'Timesheets',
    icon: ClipboardList,
    gradient: ['#f59e0b', '#fbbf24'],
    route: '/(shared-screens)/timesheets/approvals',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    gradient: ['#6b7280', '#9ca3af'],
    route: '/(tabs)/(admin)/settings',
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const { user } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();
  const [refreshing, setRefreshing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isMountedRef = useRef(true);

  // Track mount state to avoid state updates on unmounted component
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { data: teachersData, refetch: refetchTeachers } = useTeachers({ page_size: 1 });
  const { data: studentsData, refetch: refetchStudents } = useStudents({ page_size: 1 });
  const { data: classesData, refetch: refetchClasses } = useClasses({ page_size: 1 });
  const { data: attendanceStats, refetch: refetchAttendance } = useDashboardAttendanceStats();

  // Fetch timetable for admins who are also teachers
  const {
    data: timetableData,
    isLoading: loadingTimetable,
    refetch: refetchTimetable,
  } = useMyTimetable();

  // Use shared hook for formatting attendance display
  const getAttendanceDisplay = useAttendanceDisplay(attendanceStats);

  // Build stats configuration with current values
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
        id: 'teachers',
        title: 'Teachers',
        value: teachersData?.totalCount?.toLocaleString() ?? '0',
        icon: Users,
        gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
        shadowColor: '#0891b2',
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
    ],
    [studentsData, teachersData, classesData, getAttendanceDisplay]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([
      refetchTeachers(),
      refetchStudents(),
      refetchClasses(),
      refetchAttendance(),
      refetchTimetable(),
    ]).finally(() => {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    });
  }, [refetchTeachers, refetchStudents, refetchClasses, refetchAttendance, refetchTimetable]);

  const profileImageUrl =
    getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);

  return (
    <View style={styles.container}>
      <GradientHeader
        greeting={`${getGreeting()} ${getGreetingEmoji()}`}
        title={user?.full_name ?? 'Principal Admin'}
        subtitle="Administrator"
        onNotificationPress={() => router.push('/(shared-screens)/notifications')}
        right={
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/(admin)/settings')}
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
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                  {(user?.full_name ?? 'A').charAt(0).toUpperCase()}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {user && (
          <VerificationBanner
            user={user}
            onVerifyEmail={() =>
              router.push('/(shared-screens)/change-email?mode=verify&from=dashboard' as never)
            }
            onVerifyPhone={() =>
              router.push('/(shared-screens)/change-phone?mode=verify&from=dashboard' as never)
            }
          />
        )}

        {/* Stats Grid - uses shared component */}
        <StatsGrid stats={statsConfig} />

        {/* Quick Access */}
        <Animated.View
          entering={FadeInDown.delay(400).springify().damping(15)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Star size={16} color="#10b981" />
          </View>
          <View style={styles.adminLinksGrid}>
            {adminLinks.map((link, index) => (
              <Animated.View
                key={link.id}
                entering={ZoomIn.delay(450 + index * 60)
                  .springify()
                  .damping(14)}
                style={[styles.adminLinkItem, { width: viewportWidth >= 768 ? '25%' : '33.333%' }]}
              >
                <PressableScale
                  style={styles.adminLinkCard}
                  onPress={() => {
                    if (link.route) {
                      router.push(link.route as never); // NOSONAR
                    }
                  }}
                >
                  <LinearGradient
                    colors={link.gradient}
                    style={styles.adminLinkIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <link.icon size={22} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  <Text style={styles.adminLinkLabel}>{link.title}</Text>
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Today's Schedule (uses shared component) */}
        <TodaySchedule timetableData={timetableData} isLoading={loadingTimetable} maxDisplay={4} />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  headerGradient: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  circle2: {
    position: 'absolute',
    bottom: -70,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle3: {
    position: 'absolute',
    top: 20,
    left: width * 0.4,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: { zIndex: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  roleTag: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
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
  content: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 100 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', letterSpacing: -0.2 },
  seeAll: { fontSize: 13, color: '#10b981', fontWeight: '700' },
  adminLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  adminLinkItem: { alignItems: 'center' },
  adminLinkCard: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    width: '100%',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0fdf4',
  },
  adminLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  adminLinkLabel: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'center' },
});
