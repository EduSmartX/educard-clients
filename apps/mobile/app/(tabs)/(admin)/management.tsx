/**
 * Management Screen
 * Shows management options: Teachers, Classes, Subjects, Students
 * Fetches real counts from API
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  GraduationCap,
  UserCircle,
  UserCheck,
  BookMarked,
  Building2,
  LucideIcon,
} from 'lucide-react-native';
import { Colors, getRoleGradient, getRoleThemeColors } from '@educard/shared';
import { useAuthStore } from '@/lib/auth-store';
import { useMyProfilePhoto } from '@/hooks';
import { useTeachers } from '@/features/teachers';
import { useStudents } from '@/features/students';
import { useClasses } from '@/features/classes';
import { useSubjects } from '@/features/subjects';

// Get admin theme colors
const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

interface ManagementItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  route: string;
}

const managementItemsConfig: ManagementItem[] = [
  {
    id: 'teachers',
    title: 'Teachers',
    subtitle: 'Manage teaching staff',
    icon: UserCheck,
    iconColor: '#7c3aed',
    bgColor: '#ede9fe', // Light purple/violet
    route: '/(tabs)/(admin)/teachers',
  },
  {
    id: 'classes',
    title: 'Classes',
    subtitle: 'Manage class sections',
    icon: Building2,
    iconColor: '#0891b2',
    bgColor: '#cffafe', // Light cyan
    route: '/(tabs)/(admin)/classes',
  },
  {
    id: 'subjects',
    title: 'Subjects',
    subtitle: 'Manage subjects & curriculum',
    icon: BookMarked,
    iconColor: '#059669',
    bgColor: '#d1fae5', // Light green/mint
    route: '/(tabs)/(admin)/subjects',
  },
  {
    id: 'students',
    title: 'Students',
    subtitle: 'Manage student records',
    icon: GraduationCap,
    iconColor: '#ea580c',
    bgColor: '#ffedd5', // Light orange/peach
    route: '/(tabs)/(admin)/students',
  },
];

export default function ManagementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();

  // Fetch counts from API
  const { data: teachersData } = useTeachers({ page_size: 1 });
  const { data: studentsData } = useStudents({ page_size: 1 });
  const { data: classesData } = useClasses({ page_size: 1 });
  const { data: subjectsData } = useSubjects({ page_size: 1 });

  // Build counts map
  const counts: Record<string, number | undefined> = {
    teachers: teachersData?.totalCount,
    students: studentsData?.totalCount,
    classes: classesData?.totalCount,
    subjects: subjectsData?.totalCount,
  };

  // Profile photo from attachments API takes priority
  const profileImageUrl = profilePhoto?.thumbnail_url || user?.profile_image;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={adminGradient} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Management</Text>
            <Text style={styles.headerSubtitle}>Manage your organization</Text>
          </View>

          {/* Profile */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/(admin)/settings')}
          >
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
              <UserCircle size={32} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Management Icons Grid - 3 per row with pastel backgrounds */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.gridContainer}>
          {managementItemsConfig.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(300 + index * 80).duration(400)}
              style={styles.gridItem}
            >
              <TouchableOpacity
                style={styles.iconCard}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                {/* Pastel colored icon background */}
                <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
                  <item.icon size={28} color={item.iconColor} strokeWidth={2} />
                </View>
                <Text style={styles.iconLabel} numberOfLines={1}>
                  {item.title}
                </Text>
                {counts[item.id] !== undefined && (
                  <View style={[styles.countBadge, { backgroundColor: item.bgColor }]}>
                    <Text style={[styles.iconCount, { color: item.iconColor }]}>
                      {counts[item.id]?.toLocaleString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Grid Layout - 3 icons per row with pastel backgrounds
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 20,
    gap: 12,
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
  },
  iconCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[800],
    textAlign: 'center',
    marginBottom: 4,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  iconCount: {
    fontSize: 11,
    fontWeight: '700',
  },
});
