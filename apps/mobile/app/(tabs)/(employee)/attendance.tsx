/**
 * Employee Attendance Screen
 * Main attendance hub for teachers showing:
 * - Student Attendance (Mark, Summary, Report)
 * - My Timesheet (view/submit own attendance)
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ClipboardCheck,
  BarChart3,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import { Screen } from '@/components/layout';
// colors unused - keeping for future use
// import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth-store';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48 - 12) / 2;

// API Functions
const getDashboardStats = async (): Promise<{
  working_day_status: {
    is_working_day: boolean;
    reason?: string;
    message?: string;
    is_holiday?: boolean;
    holiday_name?: string;
  };
  students_registered: number;
  students_marked: number;
  students_present: number;
  employees_registered: number;
  employees_marked: number;
  employees_present: number;
}> => {
  const response = await apiClient.get('/attendance/admin/dashboard-stats/');
  const data = response.data as { data?: unknown } | undefined;
  return (data?.data ?? response.data) as {
    working_day_status: {
      is_working_day: boolean;
      reason?: string;
      message?: string;
      is_holiday?: boolean;
      holiday_name?: string;
    };
    students_registered: number;
    students_marked: number;
    students_present: number;
    employees_registered: number;
    employees_marked: number;
    employees_present: number;
  };
};

const getEmployeeAttendance = async (): Promise<{
  results: {
    date: string;
    status: string;
    check_in_time?: string;
    check_out_time?: string;
  }[];
}> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const response = await apiClient.get('/attendance/employee-attendance/', {
    params: { start_date: today, end_date: today },
  });
  const data = response.data as { data?: unknown } | undefined;
  return (data?.data ?? response.data) as {
    results: {
      date: string;
      status: string;
      check_in_time?: string;
      check_out_time?: string;
    }[];
  };
};

const getEligibleClasses = async (): Promise<
  { public_id: string; display_name: string; total_students: number }[]
> => {
  const response = await apiClient.get('/classes/employee/eligible/');
  const data = response.data as { data?: unknown } | undefined;
  return (data?.data ?? response.data) as {
    public_id: string;
    display_name: string;
    total_students: number;
  }[];
};

// Quick Action Items
const studentAttendanceActions = [
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    subtitle: 'Mark student attendance',
    icon: ClipboardCheck,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    route: '/(shared-screens)/attendance/mark',
  },
  {
    id: 'view-summary',
    title: 'View Summary',
    subtitle: "Today's attendance stats",
    icon: BarChart3,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    route: '/(shared-screens)/attendance/summary',
  },
  {
    id: 'attendance-report',
    title: 'Attendance Report',
    subtitle: 'Class-wise reports',
    icon: FileText,
    color: '#059669',
    bgColor: '#ecfdf5',
    route: '/(shared-screens)/attendance/report',
  },
];

const timesheetActions = [
  {
    id: 'my-timesheet',
    title: 'My Timesheet',
    subtitle: 'View & submit timesheet',
    icon: Calendar,
    color: '#f97316',
    bgColor: '#fff7ed',
    route: '/(shared-screens)/timesheets/my-submissions',
  },
];

export default function EmployeeAttendanceScreen() {
  const router = useRouter();
  const { user: _user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: dashboardStats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['attendance-dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['employee-today-attendance'],
    queryFn: getEmployeeAttendance,
  });

  const { data: eligibleClasses, refetch: refetchClasses } = useQuery({
    queryKey: ['employee-eligible-classes'],
    queryFn: getEligibleClasses,
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchAttendance(), refetchClasses()]);
    setRefreshing(false);
  }, [refetchStats, refetchAttendance, refetchClasses]);

  const workingDayStatus = dashboardStats?.working_day_status;
  const isWorkingDay = workingDayStatus?.is_working_day ?? true;

  const myTodayRecord = useMemo(() => {
    if (!todayAttendance?.results?.length) return null;
    return todayAttendance.results[0];
  }, [todayAttendance]);

  const totalStudents = eligibleClasses?.reduce((acc, c) => acc + (c.total_students || 0), 0) || 0;

  return (
    <Screen scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={['#3b82f6', '#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Attendance</Text>
            <Text style={styles.headerSubtitle}>{format(new Date(), 'EEEE, dd MMMM yyyy')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Working Day Status Banner */}
          {!isWorkingDay && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.holidayBanner}>
              <PartyPopper size={20} color="#dc2626" />
              <View style={styles.holidayBannerText}>
                <Text style={styles.holidayTitle}>
                  {workingDayStatus?.holiday_name || 'Not a Working Day'}
                </Text>
                <Text style={styles.holidayMessage}>
                  {workingDayStatus?.message ||
                    workingDayStatus?.reason ||
                    'Attendance marking disabled'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* My Status Card */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.myStatusCard}>
              <View style={styles.myStatusHeader}>
                <View style={styles.myStatusIcon}>
                  <UserCheck size={20} color="#3b82f6" />
                </View>
                <Text style={styles.myStatusTitle}>My Attendance Today</Text>
              </View>

              <View style={styles.myStatusContent}>
                {myTodayRecord ? (
                  <>
                    <View
                      style={[
                        styles.statusBadge,
                        myTodayRecord.status === 'PRESENT'
                          ? styles.presentBadge
                          : myTodayRecord.status === 'ABSENT'
                            ? styles.absentBadge
                            : styles.pendingBadge,
                      ]}
                    >
                      <CheckCircle
                        size={14}
                        color={
                          myTodayRecord.status === 'PRESENT'
                            ? '#059669'
                            : myTodayRecord.status === 'ABSENT'
                              ? '#dc2626'
                              : '#f59e0b'
                        }
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          myTodayRecord.status === 'PRESENT'
                            ? styles.presentText
                            : myTodayRecord.status === 'ABSENT'
                              ? styles.absentText
                              : styles.pendingText,
                        ]}
                      >
                        {myTodayRecord.status}
                      </Text>
                    </View>
                    {!!myTodayRecord.check_in_time && (
                      <View style={styles.timeInfo}>
                        <Clock size={12} color="#6b7280" />
                        <Text style={styles.timeText}>
                          In: {myTodayRecord.check_in_time.slice(0, 5)}
                          {!!myTodayRecord.check_out_time &&
                            ` • Out: ${myTodayRecord.check_out_time.slice(0, 5)}`}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.notMarkedBadge}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <Text style={styles.notMarkedText}>Not marked yet</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Quick Stats */}
          {loadingStats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                  <Users size={18} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{eligibleClasses?.length || 0}</Text>
                <Text style={styles.statLabel}>My Classes</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#f5f3ff' }]}>
                  <Users size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{totalStudents}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
                  <CheckCircle size={18} color="#059669" />
                </View>
                <Text style={styles.statValue}>{dashboardStats?.students_marked || 0}</Text>
                <Text style={styles.statLabel}>Marked Today</Text>
              </View>
            </Animated.View>
          )}

          {/* Student Attendance Section */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={styles.sectionTitle}>Student Attendance</Text>
            <View style={styles.actionGrid}>
              {studentAttendanceActions.map((action, _index) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                    <action.icon size={22} color={action.color} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* My Timesheet Section */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text style={styles.sectionTitle}>My Timesheet</Text>
            {timesheetActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.listActionCard}
                onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}
                activeOpacity={0.7}
              >
                <View style={[styles.listActionIcon, { backgroundColor: action.bgColor }]}>
                  <action.icon size={22} color={action.color} />
                </View>
                <View style={styles.listActionText}>
                  <Text style={styles.listActionTitle}>{action.title}</Text>
                  <Text style={styles.listActionSubtitle}>{action.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Eligible Classes Quick View */}
          {eligibleClasses && eligibleClasses.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600)}>
              <Text style={styles.sectionTitle}>My Classes</Text>
              <View style={styles.classesContainer}>
                {eligibleClasses.slice(0, 4).map((cls) => (
                  <TouchableOpacity
                    key={cls.public_id}
                    style={styles.classChip}
                    onPress={() =>
                      router.push({
                        pathname: '/(shared-screens)/attendance/mark',
                        params: { classId: cls.public_id },
                      } as Parameters<typeof router.push>[0])
                    }
                  >
                    <Text style={styles.classChipText}>{cls.display_name}</Text>
                    <Text style={styles.classChipCount}>{cls.total_students} students</Text>
                  </TouchableOpacity>
                ))}
                {eligibleClasses.length > 4 && (
                  <View style={styles.moreClassesChip}>
                    <Text style={styles.moreClassesText}>+{eligibleClasses.length - 4} more</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { alignItems: 'flex-start' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  holidayBannerText: { flex: 1 },
  holidayTitle: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
  holidayMessage: { fontSize: 12, color: '#991b1b', marginTop: 2 },
  myStatusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  myStatusHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  myStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myStatusTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  myStatusContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presentBadge: { backgroundColor: '#d1fae5' },
  absentBadge: { backgroundColor: '#fee2e2' },
  pendingBadge: { backgroundColor: '#fef3c7' },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  presentText: { color: '#059669' },
  absentText: { color: '#dc2626' },
  pendingText: { color: '#d97706' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#6b7280' },
  notMarkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  notMarkedText: { fontSize: 12, fontWeight: '500', color: '#d97706' },
  loadingContainer: { alignItems: 'center', paddingVertical: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  actionSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  listActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  listActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listActionText: { flex: 1, marginLeft: 14 },
  listActionTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  listActionSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  classesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  classChip: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  classChipText: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },
  classChipCount: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  moreClassesChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  moreClassesText: { fontSize: 12, color: '#6b7280' },
});
