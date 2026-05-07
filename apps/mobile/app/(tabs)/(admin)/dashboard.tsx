/**
 * Admin Dashboard — Premium UI
 * Glassmorphism cards, spring animations, vibrant gradients, floating feel
 */

import { getRoleThemeColors } from '@educard/shared';
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
} from 'lucide-react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';

import { getMediaUrl } from '@/constants/config';
import { useDashboardAttendanceStats } from '@/features/attendance/hooks/use-attendance';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useTeachers } from '@/features/teachers';
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

type ActivityType = 'success' | 'info' | 'warning';

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

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: ActivityType;
  icon: typeof GraduationCap;
}

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    title: 'New student enrolled',
    subtitle: 'John Doe - Class 10A',
    time: '2 min ago',
    type: 'success',
    icon: GraduationCap,
  },
  {
    id: '2',
    title: 'Fee payment received',
    subtitle: 'Rs. 25,000 from Parent ID: P1234',
    time: '15 min ago',
    type: 'info',
    icon: Star,
  },
  {
    id: '3',
    title: 'Teacher leave approved',
    subtitle: 'Ms. Smith - 3 days leave',
    time: '1 hour ago',
    type: 'warning',
    icon: CalendarCheck,
  },
];

const upcomingEvents = [
  {
    id: '1',
    title: 'Staff Meeting',
    date: 'Today, 3:00 PM',
    gradient: ['#6366f1', '#8b5cf6'] as const,
  },
  {
    id: '2',
    title: 'Parent-Teacher Meet',
    date: 'Tomorrow, 10:00 AM',
    gradient: ['#10b981', '#059669'] as const,
  },
  {
    id: '3',
    title: 'Annual Day Prep',
    date: 'Fri, 2:00 PM',
    gradient: ['#f59e0b', '#ea580c'] as const,
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
    title: 'Leave Alloc.',
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

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'success':
      return { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' };
    case 'info':
      return { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' };
    case 'warning':
      return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
    default:
      return { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  }
};

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
    ]).finally(() => {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    });
  }, [refetchTeachers, refetchStudents, refetchClasses, refetchAttendance]);

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

        {/* Recent Activity */}
        <Animated.View
          entering={FadeInDown.delay(600).springify().damping(15)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.map((activity, index) => {
            const actColors = getActivityColor(activity.type);
            return (
              <Animated.View
                key={activity.id}
                entering={SlideInRight.delay(650 + index * 70)
                  .springify()
                  .damping(16)}
              >
                <TouchableOpacity style={styles.activityCard} activeOpacity={0.85}>
                  <View
                    style={[
                      styles.activityIconBg,
                      { backgroundColor: actColors.bg, borderColor: actColors.border },
                    ]}
                  >
                    <activity.icon size={16} color={actColors.color} strokeWidth={2} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                  <View style={styles.activityTimeBadge}>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Upcoming Events */}
        <Animated.View
          entering={FadeInDown.delay(800).springify().damping(15)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity>
              <Calendar size={18} color="#10b981" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
          >
            {upcomingEvents.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInRight.delay(850 + index * 80)
                  .springify()
                  .damping(14)}
              >
                <TouchableOpacity style={styles.eventCard} activeOpacity={0.8}>
                  <LinearGradient
                    colors={event.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.eventGradientBar}
                  />
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <View style={styles.eventArrowBg}>
                    <ChevronRight size={14} color="#10b981" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0fdf4',
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  activitySubtitle: { fontSize: 11, color: '#64748b', lineHeight: 15 },
  activityTimeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityTime: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  eventsScroll: { gap: 10 },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    width: 160,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#f0fdf4',
    overflow: 'hidden',
  },
  eventGradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 18,
  },
  eventDate: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  eventArrowBg: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
