/**
 * Admin Dashboard — Premium UI
 * Glassmorphism cards, spring animations, vibrant gradients, floating feel
 */

import { useNavigation } from '@react-navigation/native';
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
  RefreshControl,
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
import { getMediaUrl } from '@/constants/config';
import {
  useDashboardAttendanceStats,
  useAttendanceDisplay,
} from '@/features/attendance/hooks';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useTeachers } from '@/features/teachers';
import { useMyTimetable } from '@/features/timetable';
import { useMyProfilePhoto } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { AdminTabNavigation } from '@/navigation/types';

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

interface AdminLinkItem {
  id: string;
  title: string;
  icon: typeof Users;
  gradient: readonly [string, string];
  screen?: MenuTarget;
}

const adminLinks: AdminLinkItem[] = [
  {
    id: 'homework',
    title: 'Homework',
    icon: BookOpen,
    gradient: ['#7c3aed', '#a78bfa'],
    screen: 'HomeworkList',
  },
  {
    id: 'leave-allocations',
    title: 'Leave Policy',
    icon: FileText,
    gradient: ['#8b5cf6', '#a78bfa'],
    screen: 'LeaveAllocations',
  },
  {
    id: 'org-preferences',
    title: 'Org Prefs',
    icon: SlidersHorizontal,
    gradient: ['#0ea5e9', '#38bdf8'],
    screen: 'Preferences',
  },
  {
    id: 'holiday-calendar',
    title: 'Holidays',
    icon: Calendar,
    gradient: ['#ef4444', '#f87171'],
    screen: 'Holidays',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Appr.',
    icon: CalendarCheck,
    gradient: ['#10b981', '#34d399'],
    screen: 'LeaveApprovals',
  },
  {
    id: 'timesheet-approvals',
    title: 'Timesheets',
    icon: ClipboardList,
    gradient: ['#f59e0b', '#fbbf24'],
    screen: 'TimesheetApprovals',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    gradient: ['#6b7280', '#9ca3af'],
    screen: 'Settings',
  },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminTabNavigation>();
  const { width: viewportWidth } = useWindowDimensions();
  const { user } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();
  const [refreshing, setRefreshing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { data: teachersData, refetch: refetchTeachers } = useTeachers({
    page_size: 1,
  });
  const { data: studentsData, refetch: refetchStudents } = useStudents({
    page_size: 1,
  });
  const { data: classesData, refetch: refetchClasses } = useClasses({
    page_size: 1,
  });
  const { data: attendanceStats, refetch: refetchAttendance } =
    useDashboardAttendanceStats();

  const {
    data: timetableData,
    isLoading: loadingTimetable,
    refetch: refetchTimetable,
  } = useMyTimetable();

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
    [studentsData, teachersData, classesData, getAttendanceDisplay],
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
  }, [
    refetchTeachers,
    refetchStudents,
    refetchClasses,
    refetchAttendance,
    refetchTimetable,
  ]);

  const profileImageUrl =
    getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);

  const goToSettings = () => navigation.navigate('Settings');
  const goToNotifications = () => navigation.navigate('Notifications');

  const handleLinkPress = (screen?: MenuTarget) => {
    if (screen) navigateToScreen(navigation, screen);
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        greeting={`${getGreeting()} ${getGreetingEmoji()}`}
        title={user?.full_name ?? 'Principal Admin'}
        subtitle="Administrator"
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
      >
        <GreetingCard
          name={(user?.full_name ?? 'Admin').split(' ')[0]}
          subtitle="Here is an overview of your school today."
          highlight="Your school is running smoothly!"
          colors={['#4f46e5', '#7c3aed', '#a21caf']}
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

        <Animated.View
          entering={FadeInDown.delay(400).springify().damping(15)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Star size={16} color="#10b981" />
          </View>
          <View style={styles.adminLinksGrid}>
            {adminLinks.map((link, index) => {
              const LinkIcon = link.icon;
              return (
                <Animated.View
                  key={link.id}
                  entering={ZoomIn.delay(450 + index * 60)
                    .springify()
                    .damping(14)}
                  style={[
                    styles.adminLinkItem,
                    viewportWidth >= 768
                      ? styles.adminLinkItemTablet
                      : styles.adminLinkItemPhone,
                  ]}
                >
                  <PressableScale
                    style={styles.adminLinkCard}
                    onPress={() => handleLinkPress(link.screen)}
                  >
                    <LinearGradient
                      colors={link.gradient}
                      style={styles.adminLinkIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <LinkIcon size={22} color="#fff" strokeWidth={2} />
                    </LinearGradient>
                    <Text style={styles.adminLinkLabel}>{link.title}</Text>
                  </PressableScale>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        <TodaySchedule
          timetableData={timetableData}
          isLoading={loadingTimetable}
          maxDisplay={4}
          onViewAll={() => navigateToScreen(navigation, 'Timetable')}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
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
  content: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 100 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.2,
  },
  adminLinksGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  adminLinkItem: { alignItems: 'center', padding: 6 },
  adminLinkItemPhone: { width: '33.333%' },
  adminLinkItemTablet: { width: '25%' },
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
  adminLinkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  bottomSpacer: { height: 100 },
});
