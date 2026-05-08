/**
 * Admin Dashboard — Premium UI
 * Glassmorphism cards, spring animations, vibrant gradients, floating feel
 */

import { getRoleThemeColors, getSubjectColor } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Bell,
  Calendar,
  ChevronRight,
  CalendarCheck,
  Settings,
  FileText,
  ClipboardList,
  SlidersHorizontal,
  Star,
  AlertCircle,
} from 'lucide-react-native';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, SlideInRight } from 'react-native-reanimated';

import { getMediaUrl } from '@/constants/config';
import { useDashboardAttendanceStats } from '@/features/attendance/hooks/use-attendance';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useTeachers } from '@/features/teachers';
import { useMyTimetable, type TimetableEntry } from '@/features/timetable';
import { useMyProfilePhoto } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';

const { width } = Dimensions.get('window');
const STAT_CARD_WIDTH = (width - 48) / 2;

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

interface StatItem {
  id: string;
  title: string;
  icon: typeof GraduationCap;
  gradient: readonly [string, string, string];
  shadowColor: string;
}

const statsConfig: StatItem[] = [
  {
    id: 'students',
    title: 'Students',
    icon: GraduationCap,
    gradient: ['#667eea', '#764ba2', '#8b5cf6'],
    shadowColor: '#764ba2',
  },
  {
    id: 'teachers',
    title: 'Teachers',
    icon: Users,
    gradient: ['#06b6d4', '#0891b2', '#0e7490'],
    shadowColor: '#0891b2',
  },
  {
    id: 'classes',
    title: 'Classes',
    icon: BookOpen,
    gradient: ['#10b981', '#059669', '#047857'],
    shadowColor: '#059669',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    icon: Clock,
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    shadowColor: '#d97706',
  },
];

interface AdminLinkItem {
  id: string;
  title: string;
  icon: typeof Users;
  gradient: readonly [string, string];
  route?: string;
}

const adminLinks: AdminLinkItem[] = [
  {
    id: 'leave-allocations',
    title: 'Leave Policy',
    icon: FileText,
    gradient: ['#8b5cf6', '#a78bfa'],
    route: '/(admin-screens)/leave/allocations',
  },
  {
    id: 'org-preferences',
    title: 'Org Prefs',
    icon: SlidersHorizontal,
    gradient: ['#0ea5e9', '#38bdf8'],
    route: '/(admin-screens)/preferences',
  },
  {
    id: 'holiday-calendar',
    title: 'Holidays',
    icon: Calendar,
    gradient: ['#ef4444', '#f87171'],
    route: '/(admin-screens)/holidays',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Appr.',
    icon: CalendarCheck,
    gradient: ['#10b981', '#34d399'],
    route: '/(admin-screens)/leave/approvals',
  },
  {
    id: 'timesheet-approvals',
    title: 'Timesheets',
    icon: ClipboardList,
    gradient: ['#f59e0b', '#fbbf24'],
    route: '/(admin-screens)/timesheets/approvals',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    gradient: ['#6b7280', '#9ca3af'],
    route: '/(tabs)/(admin)/settings',
  },
];

// Day labels (0=Monday, 6=Sunday)
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminDashboard() {
  const router = useRouter();
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

  // Get today's day index (0=Monday, 6=Sunday)
  const todayDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  // Get today's classes sorted by time
  const todayClasses = useMemo((): TimetableEntry[] => {
    if (!timetableData?.days) return [];
    const entries =
      timetableData.days[todayDayNum] || timetableData.days[String(todayDayNum)] || [];
    return [...entries].sort((a, b) => {
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      return timeA.localeCompare(timeB);
    });
  }, [timetableData, todayDayNum]);

  // Determine class status: completed, ongoing, or upcoming
  const getClassStatus = useCallback((entry: TimetableEntry) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (entry.start_time || '00:00').split(':').map(Number);
    const [endH, endM] = (entry.end_time || '00:00').split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= endMinutes) return 'completed';
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return 'ongoing';
    return 'upcoming';
  }, []);

  // Find current or next upcoming class
  const currentOrNextEntry = useMemo(() => {
    for (const entry of todayClasses) {
      const status = getClassStatus(entry);
      if (status === 'ongoing' || status === 'upcoming') {
        return { entry, status };
      }
    }
    return null;
  }, [todayClasses, getClassStatus]);

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Format attendance display
  const getAttendanceDisplay = () => {
    if (!attendanceStats) return '...';
    if (attendanceStats.is_holiday) {
      return attendanceStats.holiday_name ?? 'Holiday';
    }
    if (!attendanceStats.is_working_day) {
      return 'Off Day';
    }
    if (attendanceStats.overall_attendance_percentage === null) {
      return 'N/A';
    }
    return `${attendanceStats.overall_attendance_percentage}%`;
  };

  const statsValues: Record<string, string> = {
    students: studentsData?.totalCount?.toLocaleString() ?? '0',
    teachers: teachersData?.totalCount?.toLocaleString() ?? '0',
    classes: classesData?.totalCount?.toLocaleString() ?? '0',
    attendance: getAttendanceDisplay(),
  };

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
              <Text style={styles.userName}>{user?.full_name ?? 'Principal Admin'}</Text>
              <Text style={styles.roleTag}>Administrator</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
                <Bell size={18} color="#fff" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileBtn}
                onPress={() => router.push('/(tabs)/(admin)/settings')}
                activeOpacity={0.8}
              >
                {profileImageUrl && !imgError ? (
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.profileImage}
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
        {/* Floating Stats Grid */}
        <View style={styles.statsGrid}>
          {statsConfig.map((stat, index) => (
            <Animated.View
              key={stat.id}
              entering={ZoomIn.delay(150 + index * 80)
                .springify()
                .damping(12)
                .stiffness(100)}
              style={[styles.statCard, { shadowColor: stat.shadowColor }]}
            >
              <LinearGradient
                colors={stat.gradient}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statHeader}>
                  <View style={styles.statIconContainer}>
                    <stat.icon size={16} color="#fff" strokeWidth={2.5} />
                  </View>
                </View>
                <Text style={styles.statValue}>{statsValues[stat.id]}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

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
                style={styles.adminLinkItem}
              >
                <TouchableOpacity
                  style={styles.adminLinkCard}
                  onPress={() => {
                    if (link.route) {
                      router.push(link.route as `/${string}`);
                    }
                  }}
                  activeOpacity={0.75}
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
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Today's Schedule (if admin has timetable entries) */}
        {todayClasses.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(550).springify().damping(15)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule — {DAY_LABELS[todayDayNum]}</Text>
              <Text style={styles.seeAll}>{todayClasses.length} classes</Text>
            </View>

            {/* Current/Next Class Banner */}
            {currentOrNextEntry && (
              <View style={styles.nextClassBanner}>
                <View style={styles.nextClassIconBg}>
                  {currentOrNextEntry.status === 'ongoing' ? (
                    <AlertCircle size={20} color="#059669" />
                  ) : (
                    <Clock size={20} color="#059669" />
                  )}
                </View>
                <View style={styles.nextClassContent}>
                  <Text style={styles.nextClassLabel}>
                    {currentOrNextEntry.status === 'ongoing' ? 'Currently Teaching' : 'Next Class'}
                  </Text>
                  <Text style={styles.nextClassSubject}>
                    {currentOrNextEntry.entry.subject_name ?? currentOrNextEntry.entry.slot_label}
                  </Text>
                  <Text style={styles.nextClassMeta}>
                    {currentOrNextEntry.entry.class_name} •{' '}
                    {formatTime(currentOrNextEntry.entry.start_time)} -{' '}
                    {formatTime(currentOrNextEntry.entry.end_time)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.nextClassBadge,
                    currentOrNextEntry.status === 'ongoing' && styles.nextClassBadgeLive,
                  ]}
                >
                  <Text
                    style={[
                      styles.nextClassBadgeText,
                      currentOrNextEntry.status === 'ongoing' && styles.nextClassBadgeTextLive,
                    ]}
                  >
                    {currentOrNextEntry.status === 'ongoing' ? 'Live' : 'Up Next'}
                  </Text>
                </View>
              </View>
            )}

            {/* Schedule List */}
            {todayClasses.slice(0, 4).map((entry, index) => {
              const status = getClassStatus(entry);
              const isCurrentOrNext = currentOrNextEntry?.entry.public_id === entry.public_id;
              const subjectColor = getSubjectColor(
                entry.subject_name ?? entry.slot_label ?? 'default'
              );

              return (
                <Animated.View
                  key={entry.public_id || index}
                  entering={SlideInRight.delay(600 + index * 60)
                    .springify()
                    .damping(16)}
                >
                  <View style={[styles.scheduleCard, isCurrentOrNext && styles.scheduleCardActive]}>
                    <View style={[styles.scheduleBar, { backgroundColor: subjectColor.hex }]} />
                    <View style={styles.scheduleTimeBox}>
                      <Text
                        style={[styles.scheduleTime, isCurrentOrNext && styles.scheduleTimeActive]}
                      >
                        {formatTime(entry.start_time)}
                      </Text>
                    </View>
                    <View style={styles.scheduleContent}>
                      <Text
                        style={[
                          styles.scheduleSubject,
                          isCurrentOrNext && styles.scheduleSubjectActive,
                        ]}
                      >
                        {entry.subject_name ?? entry.slot_label}
                      </Text>
                      <Text style={styles.scheduleClass}>
                        {entry.class_name}
                        {entry.room && ` • Room ${entry.room}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.scheduleStatus,
                        status === 'completed' && styles.scheduleStatusCompleted,
                        status === 'ongoing' && styles.scheduleStatusOngoing,
                      ]}
                    >
                      <Text
                        style={[
                          styles.scheduleStatusText,
                          status === 'completed' && styles.scheduleStatusTextCompleted,
                          status === 'ongoing' && styles.scheduleStatusTextOngoing,
                        ]}
                      >
                        {status === 'completed' ? '✓' : status === 'ongoing' ? '●' : '○'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {todayClasses.length > 4 && (
              <TouchableOpacity style={styles.viewMoreBtn}>
                <Text style={styles.viewMoreText}>View all {todayClasses.length} classes</Text>
                <ChevronRight size={16} color="#059669" />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Loading state for timetable */}
        {loadingTimetable && (
          <Animated.View
            entering={FadeInDown.delay(550).springify().damping(15)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          </Animated.View>
        )}

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  statGradient: { padding: 14, height: 120, overflow: 'hidden' },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statValue: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
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
  adminLinkItem: { width: '30%', alignItems: 'center' },
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
  // Schedule styles
  nextClassBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  nextClassIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextClassContent: {
    flex: 1,
  },
  nextClassLabel: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextClassSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 2,
  },
  nextClassMeta: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  nextClassBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextClassBadgeLive: {
    backgroundColor: '#059669',
  },
  nextClassBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  nextClassBadgeTextLive: {
    color: '#fff',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0fdf4',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleCardActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  scheduleBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  scheduleTimeBox: {
    width: 60,
    marginRight: 10,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  scheduleTimeActive: {
    color: '#059669',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  scheduleSubjectActive: {
    color: '#065f46',
  },
  scheduleClass: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scheduleStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleStatusCompleted: {
    backgroundColor: '#dcfce7',
  },
  scheduleStatusOngoing: {
    backgroundColor: '#ecfdf5',
  },
  scheduleStatusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scheduleStatusTextCompleted: {
    color: '#16a34a',
  },
  scheduleStatusTextOngoing: {
    color: '#059669',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginRight: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
  },
});
