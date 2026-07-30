/**
 * ManagementScreenBase - Shared management screen layout
 * Used by both admin and employee tabs to avoid code duplication.
 */

import { useNavigation } from '@react-navigation/native';
import {
  GraduationCap,
  UserCheck,
  BookMarked,
  Building2,
  Calendar,
  ClipboardList,
  LucideIcon,
  Layers,
} from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { HeaderProfileButton } from '@/components/common';
import { useClasses } from '@/features/classes';
import { useStudents } from '@/features/students';
import { useSubjects } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { useResponsive } from '@/hooks/useResponsive';
import { LinearGradient } from '@/lib/linear-gradient';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { AdminTabNavigation } from '@/navigation/types';

export interface ManagementItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  screen: MenuTarget;
}

/** Creates management items. `canManage` only tweaks subtitle wording. */
export function createManagementItems(canManage: boolean): ManagementItem[] {
  return [
    {
      id: 'teachers',
      title: 'Teachers',
      subtitle: canManage ? 'Manage teaching staff' : 'Teaching staff',
      icon: UserCheck,
      gradient: ['#7c3aed', '#a78bfa'],
      screen: 'Teachers',
    },
    {
      id: 'classes',
      title: 'Classes',
      subtitle: canManage ? 'Manage class sections' : 'Class sections',
      icon: Building2,
      gradient: ['#0891b2', '#22d3ee'],
      screen: 'Classes',
    },
    {
      id: 'students',
      title: 'Students',
      subtitle: 'Student records',
      icon: GraduationCap,
      gradient: ['#ea580c', '#fb923c'],
      screen: 'Students',
    },
    {
      id: 'subjects',
      title: 'Subjects',
      subtitle: 'Subjects & curriculum',
      icon: BookMarked,
      gradient: ['#059669', '#34d399'],
      screen: 'Subjects',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'Class schedules',
      icon: Calendar,
      gradient: ['#6366f1', '#818cf8'],
      screen: 'Timetable',
    },
    {
      id: 'exams',
      title: 'Exams',
      subtitle: 'Exams & marks',
      icon: ClipboardList,
      gradient: ['#e11d48', '#fb7185'],
      screen: 'ExamSessions',
    },
  ];
}

interface ManagementScreenBaseProps {
  items: ManagementItem[];
  settingsScreen: MenuTarget;
}

export function ManagementScreenBase({
  items,
  settingsScreen,
}: ManagementScreenBaseProps) {
  const navigation = useNavigation<AdminTabNavigation>();
  const { gridColumns, horizontalPadding, isTablet } = useResponsive();

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

  const handleNavigate = (screen: MenuTarget) => {
    navigateToScreen(navigation, screen);
  };

  const scrollPadding = { paddingHorizontal: horizontalPadding };
  const gridItemStyle = { width: `${100 / gridColumns}%` as DimensionValue };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#10b981', '#14b8a6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View
          entering={FadeIn.delay(100).duration(800)}
          style={styles.circle1}
        />
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          style={styles.circle2}
        />
        <Animated.View
          entering={FadeIn.delay(300).duration(800)}
          style={styles.circle3}
        />

        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(15)}
          style={styles.headerContent}
        >
          <View style={styles.headerLeft}>
            <View style={styles.headerTitleRow}>
              <Layers size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerTitle}>Manage</Text>
            </View>
            <Text style={styles.headerSubtitle}>Organization data</Text>
          </View>
          <HeaderProfileButton screen={settingsScreen} />
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, scrollPadding]}
      >
        <View style={styles.gridContainer}>
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            const count = counts[item.id];
            const countColor = { color: item.gradient[0] };
            return (
              <Animated.View
                key={item.id}
                entering={ZoomIn.delay(200 + index * 60)
                  .springify()
                  .damping(13)
                  .stiffness(120)}
                style={[styles.gridItem, gridItemStyle]}
              >
                <TouchableOpacity
                  style={[styles.iconCard, isTablet && styles.iconCardTablet]}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.iconCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <ItemIcon size={26} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  <Text style={styles.iconLabel} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {count !== undefined && (
                    <View style={styles.countBadge}>
                      <Text style={[styles.iconCount, countColor]}>
                        {count.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
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
    left: '35%',
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  content: { flex: 1 },
  scrollContent: { paddingVertical: 16, paddingBottom: 100 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: { padding: 6 },
  iconCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCardTablet: {
    padding: 28,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  countBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  iconCount: { fontSize: 12, fontWeight: '700' },
});
