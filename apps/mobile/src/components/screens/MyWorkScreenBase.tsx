/**
 * MyWorkScreenBase - Shared base component for My Work screens.
 * Used by both admin and employee tabs to avoid code duplication.
 */

import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  LucideIcon,
  Clock,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  FileText,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HeaderProfileButton } from '@/components/common';
import { LinearGradient } from '@/lib/linear-gradient';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { AdminTabNavigation } from '@/navigation/types';

export { Briefcase } from 'lucide-react-native';

export interface WorkItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  screen: MenuTarget;
}

interface MyWorkScreenBaseProps {
  items: WorkItem[];
  settingsScreen: MenuTarget;
  headerIcon?: ReactNode;
}

export function MyWorkScreenBase({
  items,
  settingsScreen,
  headerIcon,
}: MyWorkScreenBaseProps) {
  const navigation = useNavigation<AdminTabNavigation>();

  const handleNavigate = (screen: MenuTarget) => {
    navigateToScreen(navigation, screen);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getRoleGradient('admin')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {headerIcon}
            <View>
              <Text style={styles.greeting}>My Work</Text>
              <Text style={styles.subtitle}>
                Your daily tasks &amp; activities
              </Text>
            </View>
          </View>
          <HeaderProfileButton screen={settingsScreen} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {items.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 60)
                  .duration(400)
                  .springify()}
                style={styles.cardWrapper}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                  >
                    <ItemIcon size={26} color="#fff" strokeWidth={1.8} />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/** Common work items shared between admin and employee */
export const COMMON_WORK_ITEMS: WorkItem[] = [
  {
    id: 'homework',
    title: 'Homework',
    subtitle: 'Manage daily assignments',
    icon: FileText,
    gradient: ['#7c3aed', '#a78bfa'],
    screen: 'HomeworkList',
  },
  {
    id: 'my-timesheet',
    title: 'My Timesheet',
    subtitle: 'Submit your attendance',
    icon: Clock,
    gradient: ['#f59e0b', '#fcd34d'],
    screen: 'TimesheetMySubmissions',
  },
  {
    id: 'my-leaves',
    title: 'My Leaves',
    subtitle: 'View & apply for leave',
    icon: CalendarDays,
    gradient: ['#10b981', '#6ee7b7'],
    screen: 'LeaveMyRequests',
  },
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    subtitle: 'Student attendance',
    icon: ClipboardCheck,
    gradient: ['#0d9488', '#2dd4bf'],
    screen: 'AttendanceMark',
  },
  {
    id: 'enter-marks',
    title: 'Enter Marks',
    subtitle: 'Exam marks entry',
    icon: GraduationCap,
    gradient: ['#e11d48', '#fb7185'],
    screen: 'ExamSessions',
  },
  {
    id: 'attendance-reports',
    title: 'Attendance Reports',
    subtitle: 'View summaries',
    icon: BarChart3,
    gradient: ['#0891b2', '#22d3ee'],
    screen: 'AttendanceReport',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cardWrapper: {
    width: '50%',
    padding: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});
