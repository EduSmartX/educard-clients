import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight, SlideInRight } from 'react-native-reanimated';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Bell, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  UserCircle,
  CalendarCheck,
  Settings,
  FileText,
  CreditCard,
  ClipboardList,
} from 'lucide-react-native';
import { Colors, getRoleGradient, getRoleThemeColors } from '@educard/shared';
import { useAuthStore } from '@/lib/auth-store';
import { useMyProfilePhoto } from '@/hooks';
import { useTeachers } from '@/features/teachers';
import { useStudents } from '@/features/students';
import { useClasses } from '@/features/classes';

const { width } = Dimensions.get('window');
const STAT_CARD_WIDTH = (width - 52) / 2;

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '👋';
  if (hour < 17) return '☀️';
  return '🌙';
};

// Get admin theme colors
const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

type ActivityType = 'success' | 'info' | 'warning';

interface StatItem {
  id: string;
  title: string;
  icon: typeof GraduationCap;
  gradient: readonly [string, string];
}

const statsConfig: StatItem[] = [
  { id: 'students', title: 'Students', icon: GraduationCap, gradient: ['#6366f1', '#8b5cf6'] },
  { id: 'teachers', title: 'Teachers', icon: Users, gradient: ['#06b6d4', '#0891b2'] },
  { id: 'classes', title: 'Classes', icon: BookOpen, gradient: ['#10b981', '#059669'] },
  { id: 'attendance', title: 'Attendance', icon: Clock, gradient: ['#f59e0b', '#d97706'] },
];

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: ActivityType;
}

const recentActivity: ActivityItem[] = [
  { id: '1', title: 'New student enrolled', subtitle: 'John Doe - Class 10A', time: '2 min ago', type: 'success' },
  { id: '2', title: 'Fee payment received', subtitle: 'Rs. 25,000 from Parent ID: P1234', time: '15 min ago', type: 'info' },
  { id: '3', title: 'Teacher leave approved', subtitle: 'Ms. Smith - 3 days leave', time: '1 hour ago', type: 'warning' },
  { id: '4', title: 'Exam results published', subtitle: 'Class 12 Final Exams', time: '2 hours ago', type: 'success' },
];

const upcomingEvents = [
  { id: '1', title: 'Staff Meeting', date: 'Today, 3:00 PM', color: Colors.primary[500] },
  { id: '2', title: 'Parent-Teacher Meet', date: 'Tomorrow, 10:00 AM', color: Colors.success[500] },
  { id: '3', title: 'Annual Day Prep', date: 'Fri, 2:00 PM', color: Colors.warning[500] },
];

// Admin quick access icons - 3 per row
interface AdminLinkItem {
  id: string;
  title: string;
  icon: typeof Users;
  color: string;
  route?: string;
}

const adminLinks: AdminLinkItem[] = [
  { id: 'leave', title: 'Leave', icon: CalendarCheck, color: '#8b5cf6' },
  { id: 'attendance', title: 'Attendance', icon: ClipboardList, color: '#06b6d4' },
  { id: 'fees', title: 'Fees', icon: CreditCard, color: '#10b981' },
  { id: 'reports', title: 'Reports', icon: FileText, color: '#f59e0b' },
  { id: 'timetable', title: 'Timetable', icon: Calendar, color: '#ec4899' },
  { id: 'settings', title: 'Settings', icon: Settings, color: '#64748b', route: '/(tabs)/(admin)/settings' },
];

const getActivityColor = (type: ActivityType): string => {
  switch (type) {
    case 'success': return Colors.success[500];
    case 'info': return Colors.info[500];
    case 'warning': return Colors.warning[500];
    default: return Colors.gray[500];
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();
  
  // Fetch real counts from API
  const { data: teachersData } = useTeachers({ page_size: 1 });
  const { data: studentsData } = useStudents({ page_size: 1 });
  const { data: classesData } = useClasses({ page_size: 1 });
  
  // Build stats with real data
  const statsValues: Record<string, string> = {
    students: studentsData?.totalCount?.toLocaleString() || '0',
    teachers: teachersData?.totalCount?.toLocaleString() || '0',
    classes: classesData?.totalCount?.toLocaleString() || '0',
    attendance: '94%', // TODO: Fetch from attendance API
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Profile photo from attachments API takes priority over user.profile_image from login
  const profileImageUrl = profilePhoto?.thumbnail_url || user?.profile_image;

  return (
    <View style={styles.container}>
      <LinearGradient colors={adminGradient} style={styles.headerGradient}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()} {getGreetingEmoji()}</Text>
              <Text style={styles.userName}>{user?.full_name || 'Principal Admin'}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationBtn}>
                <Bell size={18} color="#fff" />
                <View style={[styles.notificationBadge, { backgroundColor: adminTheme.accent }]} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileBtn}
                onPress={() => router.push('/(tabs)/(admin)/settings')}
              >
                {profileImageUrl ? (
                  <Image 
                    source={{ uri: profileImageUrl }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <UserCircle size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Grid - Compact Mobile Version */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsGrid}>
          {statsConfig.map((stat, index) => (
            <Animated.View key={stat.title} entering={FadeInDown.delay(200 + index * 100).duration(500)} style={styles.statCard}>
              <LinearGradient colors={stat.gradient} style={styles.statGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <View style={styles.statHeader}>
                  <View style={styles.statIconContainer}>
                    <stat.icon size={14} color="#fff" />
                  </View>
                  <TrendingUp size={12} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statValue}>{statsValues[stat.id]}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Admin Quick Access - 3 icons per row */}
        <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.adminLinksGrid}>
            {adminLinks.map((link, index) => (
              <Animated.View 
                key={link.id} 
                entering={FadeInDown.delay(400 + index * 50).duration(400)}
                style={styles.adminLinkItem}
              >
                <TouchableOpacity 
                  style={styles.adminLinkCard}
                  onPress={() => link.route ? router.push(link.route as any) : null}
                  activeOpacity={0.7}
                >
                  <View style={[styles.adminLinkIcon, { backgroundColor: link.color + '15' }]}>
                    <link.icon size={22} color={link.color} />
                  </View>
                  <Text style={styles.adminLinkLabel}>{link.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>
          {recentActivity.slice(0, 3).map((activity, index) => (
            <Animated.View key={activity.id} entering={SlideInRight.delay(500 + index * 50).duration(300)}>
              <TouchableOpacity style={styles.activityCard}>
                <View style={[styles.activityDot, { backgroundColor: getActivityColor(activity.type) }]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Upcoming Events */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity><Calendar size={20} color={Colors.primary[500]} /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
            {upcomingEvents.map((event, index) => (
              <Animated.View key={event.id} entering={FadeInRight.delay(700 + index * 50).duration(300)}>
                <TouchableOpacity style={[styles.eventCard, { borderLeftColor: event.color }]}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <ChevronRight size={18} color={Colors.gray[400]} style={styles.eventArrow} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerGradient: { paddingTop: 44, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)' },
  circle2: { position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerContent: { zIndex: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileImage: { width: 36, height: 36, borderRadius: 18 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.95)', marginBottom: 1, fontWeight: '500' },
  userName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  notificationBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#fff' },
  content: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 100 },
  
  // Compact Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  statCard: { width: STAT_CARD_WIDTH, borderRadius: 12, overflow: 'hidden' },
  statGradient: { padding: 10, height: 88 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statIconContainer: { width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 0 },
  statTitle: { fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 1 },
  statChange: { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  
  // Section
  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray[900], marginBottom: 12 },
  seeAll: { fontSize: 12, color: Colors.primary[500], fontWeight: '600' },
  
  // Admin Quick Access Grid - 3 per row
  adminLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  adminLinkItem: {
    width: '30%',
    alignItems: 'center',
  },
  adminLinkCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  adminLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adminLinkLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray[700],
    textAlign: 'center',
  },
  
  // Recent Activity
  activityCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, marginTop: 4 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: '600', color: Colors.gray[900], marginBottom: 2 },
  activitySubtitle: { fontSize: 11, color: Colors.gray[500], lineHeight: 15 },
  activityTime: { fontSize: 10, color: Colors.gray[400], marginTop: 2 },
  
  // Upcoming Events
  eventsScroll: { gap: 8 },
  eventCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    width: 150, 
    borderLeftWidth: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2,
    minHeight: 70,
  },
  eventTitle: { fontSize: 13, fontWeight: '600', color: Colors.gray[900], marginBottom: 4, lineHeight: 16 },
  eventDate: { fontSize: 12, color: Colors.gray[500] },
  eventArrow: { position: 'absolute', right: 10, top: '50%', marginTop: -9 },
});
