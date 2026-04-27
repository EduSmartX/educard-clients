/**
 * Management Screen — Premium UI
 * Floating gradient cards, spring bounce animations, glass effects
 */

import { Colors, getRoleGradient, getRoleThemeColors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  GraduationCap,
  User,
  UserCheck,
  BookMarked,
  Building2,
  CalendarCheck,
  Calendar,
  ClipboardList,
  Settings,
  SlidersHorizontal,
  FileText,
  LucideIcon,
  Layers,
} from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useSubjects } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { useMyProfilePhoto } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';

const { width } = Dimensions.get('window');
const adminTheme = getRoleThemeColors('admin');

interface ManagementItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  route: string;
}

const managementItemsConfig: ManagementItem[] = [
  {
    id: 'teachers',
    title: 'Teachers',
    subtitle: 'Manage teaching staff',
    icon: UserCheck,
    gradient: ['#7c3aed', '#a78bfa'],
    route: '/(tabs)/(admin)/teachers',
  },
  {
    id: 'classes',
    title: 'Classes',
    subtitle: 'Manage class sections',
    icon: Building2,
    gradient: ['#0891b2', '#22d3ee'],
    route: '/(tabs)/(admin)/classes',
  },
  {
    id: 'subjects',
    title: 'Subjects',
    subtitle: 'Subjects & curriculum',
    icon: BookMarked,
    gradient: ['#059669', '#34d399'],
    route: '/(tabs)/(admin)/subjects',
  },
  {
    id: 'students',
    title: 'Students',
    subtitle: 'Student records',
    icon: GraduationCap,
    gradient: ['#ea580c', '#fb923c'],
    route: '/(tabs)/(admin)/students',
  },
  {
    id: 'timetable',
    title: 'Timetable',
    subtitle: 'Class schedules',
    icon: Calendar,
    gradient: ['#6366f1', '#818cf8'],
    route: '/(admin-screens)/timetable',
  },
  {
    id: 'exams',
    title: 'Exams',
    subtitle: 'Exams & marks',
    icon: ClipboardList,
    gradient: ['#e11d48', '#fb7185'],
    route: '/(admin-screens)/exams/sessions',
  },
  {
    id: 'attendance',
    title: 'Attendance',
    subtitle: 'Mark class attendance',
    icon: CalendarCheck,
    gradient: ['#0d9488', '#2dd4bf'],
    route: '/(admin-screens)/attendance/mark',
  },
  {
    id: 'leave-allocations',
    title: 'Leave Alloc.',
    subtitle: 'Leave policies',
    icon: FileText,
    gradient: ['#8b5cf6', '#c084fc'],
    route: '/(admin-screens)/leave/allocations',
  },
  {
    id: 'org-preferences',
    title: 'Org Prefs',
    subtitle: 'Organization settings',
    icon: SlidersHorizontal,
    gradient: ['#0284c7', '#38bdf8'],
    route: '/(admin-screens)/preferences',
  },
  {
    id: 'holiday-calendar',
    title: 'Holidays',
    subtitle: 'Holiday calendar',
    icon: CalendarCheck,
    gradient: ['#dc2626', '#f87171'],
    route: '/(admin-screens)/holidays',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Appr.',
    subtitle: 'Approve requests',
    icon: CalendarCheck,
    gradient: ['#16a34a', '#4ade80'],
    route: '/(admin-screens)/leave/approvals',
  },
  {
    id: 'timesheet-approvals',
    title: 'Timesheets',
    subtitle: 'Approve timesheets',
    icon: ClipboardList,
    gradient: ['#d97706', '#fbbf24'],
    route: '/(admin-screens)/timesheets/approvals',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'App settings',
    icon: Settings,
    gradient: ['#475569', '#94a3b8'],
    route: '/(tabs)/(admin)/settings',
  },
];

export default function ManagementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();

  const { data: teachersData } = useTeachers({ page_size: 1 });
  const { data: studentsData } = useStudents({ page_size: 1 });
  const { data: classesData } = useClasses({ page_size: 1 });
  const { data: subjectsData } = useSubjects({ page_size: 1 });

  const counts: Record<string, number | undefined> = {
    teachers: teachersData?.totalCount,
    students: studentsData?.totalCount,
    classes: classesData?.totalCount,
    subjects: subjectsData?.totalCount,
  };

  const profileImageUrl = profilePhoto?.thumbnail_url || user?.profile_image;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#10b981', '#14b8a6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeIn.delay(100).duration(800)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.circle2} />
        <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.circle3} />

        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(15)}
          style={styles.headerContent}
        >
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleRow}>
              <Layers size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerTitle}>Management</Text>
            </View>
            <Text style={styles.headerSubtitle}>Manage your organization</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/(admin)/settings')}
            activeOpacity={0.8}
          >
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileFallback}>
                <User size={28} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gridContainer}>
          {managementItemsConfig.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={ZoomIn.delay(200 + index * 60)
                .springify()
                .damping(13)
                .stiffness(120)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={styles.iconCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.iconCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <item.icon size={26} color="#fff" strokeWidth={2} />
                </LinearGradient>
                <Text style={styles.iconLabel} numberOfLines={1}>
                  {item.title}
                </Text>
                {counts[item.id] !== undefined && (
                  <View style={styles.countBadge}>
                    <Text style={[styles.iconCount, { color: item.gradient[0] }]}>
                      {counts[item.id]?.toLocaleString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden' },
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
    bottom: -60,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle3: {
    position: 'absolute',
    top: 10,
    left: width * 0.35,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerLeft: {},
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  profileImage: { width: 44, height: 44, borderRadius: 15 },
  profileFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 20,
    gap: 12,
    justifyContent: 'flex-start',
  },
  gridItem: { width: '30%', alignItems: 'center' },
  iconCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ecfdf5',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  countBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  iconCount: { fontSize: 11, fontWeight: '800' },
});
