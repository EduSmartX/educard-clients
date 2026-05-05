/**
 * My Work Screen - Personal tasks & activities
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Clock,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  LucideIcon,
} from 'lucide-react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface WorkItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: readonly [string, string];
  route: string;
}

const workItems: WorkItem[] = [
  {
    id: 'my-timesheet',
    title: 'My Timesheet',
    subtitle: 'Submit your attendance',
    icon: Clock,
    gradient: ['#f59e0b', '#fcd34d'],
    route: '/(admin-screens)/timesheets/my-submissions',
  },
  {
    id: 'my-leaves',
    title: 'My Leaves',
    subtitle: 'View & apply for leave',
    icon: CalendarDays,
    gradient: ['#10b981', '#6ee7b7'],
    route: '/(admin-screens)/leave/my-requests',
  },
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    subtitle: 'Student attendance',
    icon: ClipboardCheck,
    gradient: ['#0d9488', '#2dd4bf'],
    route: '/(admin-screens)/attendance/mark',
  },
  {
    id: 'enter-marks',
    title: 'Enter Marks',
    subtitle: 'Exam marks entry',
    icon: GraduationCap,
    gradient: ['#e11d48', '#fb7185'],
    route: '/(admin-screens)/exams/sessions',
  },
  {
    id: 'attendance-reports',
    title: 'Attendance Reports',
    subtitle: 'View summaries',
    icon: BarChart3,
    gradient: ['#0891b2', '#22d3ee'],
    route: '/(admin-screens)/attendance',
  },
];

export default function MyWorkScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={getRoleGradient('admin')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>My Work</Text>
          <Text style={styles.subtitle}>Your daily tasks & activities</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Work Items Grid */}
        <View style={styles.grid}>
          {workItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 60)
                .duration(400)
                .springify()}
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
                  <item.icon size={26} color="#fff" strokeWidth={1.8} />
                </LinearGradient>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

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
  headerContent: {},
  greeting: {
    fontSize: 24,
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
