/**
 * Attendance Screen with Tabs
 * Combines Summary and Report views in a single screen with tabs
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, subDays, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

import { apiClient } from '@/api/client';
import { useEligibleClasses } from '@/features/attendance';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Calendar,
  RefreshCw,
  ClipboardCheck,
  PartyPopper,
  BarChart3,
  Clock,
  Filter,
  AlertTriangle,
  Award,
  Target,
  Lightbulb,
  UserX,
  ThumbsUp,
  ArrowUpRight,
  ArrowDownRight,
} from '@/lib/lucide-shim';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStats {
  date: string;
  is_holiday: boolean;
  holiday_name: string | null;
  is_working_day: boolean;
  overall_attendance_percentage: number | null;
  students: {
    total_registered: number;
    marked: number;
    present: number;
    absent: number;
    halfday: number;
    attendance_percentage: number | null;
  };
  employees: {
    total_registered: number;
    marked: number;
    present: number;
    absent: number;
    attendance_percentage: number | null;
  };
}

interface AttendanceReportData {
  total_students: number;
  total_working_days: number;
  attendance_percentage: number;
  // Per-student averages for the class
  avg_present_days: number;
  avg_absent_days: number;
  avg_half_days: number;
  // Pagination info
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  student_wise?: {
    student_id: string;
    student_name: string;
    present: number;
    absent: number;
    half_day: number;
    leave: number;
    percentage: number;
  }[];
}

const getDashboardStats = async (date: string): Promise<DashboardStats> => {
  const response = await apiClient.get(`/attendance/admin/dashboard-stats/?date=${date}`);
  return response.data.data || response.data;
};

const getAttendanceReport = async (
  classId: string | null,
  fromDate: string,
  toDate: string,
  page: number = 1,
  pageSize: number = 50
): Promise<AttendanceReportData> => {
  let url = `/attendance/admin/student-report/?page=${page}&page_size=${pageSize}`;
  if (classId) {
    url += `&class_id=${classId}`;
  }

  const response = await apiClient.post(url, {
    start_date: fromDate,
    end_date: toDate,
  });

  const data = response.data.data || response.data;
  const studentWise = data.report || [];
  const pagination = data.pagination;

  // Use total_count from pagination for total students
  const totalStudents = pagination?.total_count || studentWise.length;
  const totalWorkingDays = studentWise[0]?.total_days || 0;

  // Calculate totals for computing averages (only for current page)
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalHalfDay = 0;

  studentWise.forEach((s: any) => {
    totalPresent += s.present_days || 0;
    totalAbsent += s.absent_days || 0;
    totalHalfDay += s.halfday_count || 0;
  });

  // Calculate overall class attendance percentage based on current page
  const currentPageStudents = studentWise.length;
  const totalPossible = currentPageStudents * totalWorkingDays;
  const attendancePercentage =
    totalPossible > 0 ? Math.round(((totalPresent + totalHalfDay * 0.5) / totalPossible) * 100) : 0;

  // Calculate per-student averages for current page
  const avgPresent = currentPageStudents > 0 ? totalPresent / currentPageStudents : 0;
  const avgAbsent = currentPageStudents > 0 ? totalAbsent / currentPageStudents : 0;
  const avgHalfDay = currentPageStudents > 0 ? totalHalfDay / currentPageStudents : 0;

  return {
    total_students: totalStudents,
    total_working_days: totalWorkingDays,
    attendance_percentage: attendancePercentage,
    avg_present_days: Math.round(avgPresent * 10) / 10,
    avg_absent_days: Math.round(avgAbsent * 10) / 10,
    avg_half_days: Math.round(avgHalfDay * 10) / 10,
    pagination,
    student_wise: studentWise.map((s: any) => ({
      student_id: s.user__public_id,
      student_name: `${s.user__first_name || ''} ${s.user__last_name || ''}`.trim(),
      present: s.present_days || 0,
      absent: s.absent_days || 0,
      half_day: s.halfday_count || 0,
      leave: 0,
      percentage:
        s.total_days > 0
          ? Math.round(((s.present_days + (s.halfday_count || 0) * 0.5) / s.total_days) * 100)
          : 0,
    })),
  };
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
}) {
  const colorStyles: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
    green: { bg: '#dcfce7', iconBg: '#bbf7d0', iconColor: '#16a34a' },
    red: { bg: '#fee2e2', iconBg: '#fecaca', iconColor: '#dc2626' },
    blue: { bg: '#dbeafe', iconBg: '#bfdbfe', iconColor: '#2563eb' },
    teal: { bg: '#ccfbf1', iconBg: '#99f6e4', iconColor: '#0d9488' },
    purple: { bg: '#f3e8ff', iconBg: '#e9d5ff', iconColor: '#9333ea' },
  };
  const c = colorStyles[color] || colorStyles.blue;

  return (
    <View style={[styles.statCard, { backgroundColor: c.bg }]}>
      <View style={styles.statCardContent}>
        <View>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
          {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statCardIconBg, { backgroundColor: c.iconBg }]}>
          <Icon size={24} color={c.iconColor} />
        </View>
      </View>
    </View>
  );
}

function ProgressBar({
  label,
  present,
  absent,
  halfday,
  total,
  percentage,
  icon: Icon,
  color,
}: {
  label: string;
  present: number;
  absent: number;
  halfday: number;
  total: number;
  percentage: number | null;
  icon: React.ComponentType<any>;
  color: string;
}) {
  const colorStyles: Record<string, { primary: string; bg: string }> = {
    blue: { primary: '#2563eb', bg: '#dbeafe' },
    teal: { primary: '#0d9488', bg: '#ccfbf1' },
  };
  const c = colorStyles[color] || colorStyles.blue;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View style={styles.progressHeaderLeft}>
          <View style={[styles.progressIcon, { backgroundColor: c.bg }]}>
            <Icon size={20} color={c.primary} />
          </View>
          <Text style={styles.progressLabel}>{label}</Text>
        </View>
        <Text style={styles.progressTotal}>{total} Total</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <Text style={[styles.progressPercentage, { color: c.primary }]}>
          {percentage !== null ? `${percentage}%` : '0%'}
        </Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentage || 0}%`, backgroundColor: c.primary },
          ]}
        />
      </View>

      <View style={styles.progressStats}>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.progressStatValue}>{present}</Text>
          <Text style={styles.progressStatLabel}>Present</Text>
        </View>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.progressStatValue}>{absent}</Text>
          <Text style={styles.progressStatLabel}>Absent</Text>
        </View>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.progressStatValue}>{halfday}</Text>
          <Text style={styles.progressStatLabel}>Half Day</Text>
        </View>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, { backgroundColor: '#94a3b8' }]} />
          <Text style={styles.progressStatValue}>{total - present - absent - halfday}</Text>
          <Text style={styles.progressStatLabel}>Unmarked</Text>
        </View>
      </View>
    </View>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const colorStyles: Record<string, { bg: string; text: string }> = {
    green: { bg: '#dcfce7', text: '#16a34a' },
    red: { bg: '#fee2e2', text: '#dc2626' },
    yellow: { bg: '#fef3c7', text: '#d97706' },
    blue: { bg: '#dbeafe', text: '#2563eb' },
    purple: { bg: '#f3e8ff', text: '#9333ea' },
    gray: { bg: '#f3f4f6', text: '#374151' },
  };
  const c = colorStyles[color] || colorStyles.gray;

  return (
    <View style={[styles.statBox, { backgroundColor: c.bg }]}>
      <Text style={[styles.statBoxValue, { color: c.text }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

function SummaryTab() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', 'dashboard-stats', dateStr],
    queryFn: () => getDashboardStats(dateStr),
    staleTime: 2 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const goToPreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const displayDate = data?.date
    ? format(new Date(data.date + 'T00:00:00'), 'EEEE, dd MMMM yyyy')
    : format(selectedDate, 'EEEE, dd MMMM yyyy');

  const totalStudents = data?.students.total_registered ?? 0;
  const totalEmployees = data?.employees.total_registered ?? 0;
  const totalPresent = (data?.students.present ?? 0) + (data?.employees.present ?? 0);
  const totalMarked = (data?.students.marked ?? 0) + (data?.employees.marked ?? 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <XCircle size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load data</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Navigation */}
      <View style={styles.dateNavigationBar}>
        <TouchableOpacity onPress={goToPreviousDay} style={styles.dateNavButton}>
          <ChevronLeft size={20} color="#0d9488" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
          <CalendarDays size={18} color="#0d9488" />
          <Text style={styles.datePickerText}>{displayDate}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextDay} style={styles.dateNavButton}>
          <ChevronRight size={20} color="#0d9488" />
        </TouchableOpacity>
      </View>

      {!isToday && (
        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Go to Today</Text>
        </TouchableOpacity>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Status Badge */}
      <View style={styles.dateBar}>
        <View style={styles.dateBarLeft}>
          <View style={styles.dateIcon}>
            <Calendar size={20} color="#0d9488" />
          </View>
          <View>
            <Text style={styles.dateLabel}>{isToday ? "Today's Status" : 'Day Status'}</Text>
            <Text style={styles.dateValue}>
              {data?.is_holiday
                ? data.holiday_name || 'Holiday'
                : data?.is_working_day
                  ? 'Working Day'
                  : 'Non-Working Day'}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            data?.is_holiday
              ? styles.holidayBadge
              : data?.is_working_day
                ? styles.workingBadge
                : styles.nonWorkingBadge,
          ]}
        >
          {data?.is_holiday ? (
            <>
              <Calendar size={14} color="#d97706" />
              <Text style={styles.holidayBadgeText}>Holiday</Text>
            </>
          ) : data?.is_working_day ? (
            <>
              <CheckCircle2 size={14} color="#16a34a" />
              <Text style={styles.workingBadgeText}>Working Day</Text>
            </>
          ) : (
            <>
              <XCircle size={14} color="#6b7280" />
              <Text style={styles.nonWorkingBadgeText}>Non-Working</Text>
            </>
          )}
        </View>
      </View>

      {/* Holiday/Non-Working Banners */}
      {data?.is_holiday && data.holiday_name && (
        <View style={styles.holidayBanner}>
          <PartyPopper size={24} color="#d97706" />
          <View>
            <Text style={styles.holidayBannerTitle}>Holiday!</Text>
            <Text style={styles.holidayBannerName}>{data.holiday_name}</Text>
          </View>
        </View>
      )}

      {!data?.is_working_day && !data?.is_holiday && (
        <View style={styles.nonWorkingBanner}>
          <Calendar size={24} color="#6b7280" />
          <View>
            <Text style={styles.nonWorkingBannerTitle}>Non-Working Day</Text>
            <Text style={styles.nonWorkingBannerName}>
              {isToday ? 'Attendance not required today' : 'Attendance not required on this day'}
            </Text>
          </View>
        </View>
      )}

      {/* Stats Cards */}
      {data?.is_working_day && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Registered"
                value={totalStudents + totalEmployees}
                subtitle={`${totalStudents} students, ${totalEmployees} employees`}
                icon={Users}
                color="blue"
              />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statsHalf}>
                <StatCard
                  title={isToday ? 'Marked Today' : 'Marked'}
                  value={totalMarked}
                  icon={CheckCircle2}
                  color="teal"
                />
              </View>
              <View style={styles.statsHalf}>
                <StatCard title="Present" value={totalPresent} icon={TrendingUp} color="green" />
              </View>
            </View>
          </View>

          {data.overall_attendance_percentage !== null && (
            <LinearGradient
              colors={['#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.overallCard}
            >
              <View>
                <Text style={styles.overallLabel}>Overall Attendance Rate</Text>
                <Text style={styles.overallValue}>{data.overall_attendance_percentage}%</Text>
              </View>
              <TrendingUp size={40} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          )}

          <ProgressBar
            label="Student Attendance"
            present={data.students.present}
            absent={data.students.absent}
            halfday={data.students.halfday ?? 0}
            total={data.students.total_registered}
            percentage={data.students.attendance_percentage}
            icon={GraduationCap}
            color="blue"
          />
          <ProgressBar
            label="Employee Attendance"
            present={data.employees.present}
            absent={data.employees.absent}
            halfday={0}
            total={data.employees.total_registered}
            percentage={data.employees.attendance_percentage}
            icon={Briefcase}
            color="teal"
          />
        </>
      )}

      {/* Quick Action */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin-screens)/attendance/mark')}
        >
          <View style={styles.actionButtonIcon}>
            <ClipboardCheck size={20} color="#0d9488" />
          </View>
          <View style={styles.actionButtonText}>
            <Text style={styles.actionButtonTitle}>Mark Attendance</Text>
            <Text style={styles.actionButtonSubtitle}>Mark student attendance for a class</Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReportTab() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allStudents, setAllStudents] = useState<AttendanceReportData['student_wise']>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fromDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const toDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: classes, isLoading: loadingClasses } = useEligibleClasses();

  // Add "All Classes" option at the beginning
  const classOptions = useMemo(() => {
    if (!classes) return [];
    return [
      { public_id: 'all', display_name: '📊 All Classes (Organization)', name: 'All Classes' },
      ...classes,
    ];
  }, [classes]);

  // Initial query for first page
  const {
    data: reportData,
    isLoading: loadingReport,
    refetch,
  } = useQuery({
    queryKey: ['attendance-report', selectedClassId, fromDate, toDate, 1], // Always fetch page 1 first
    queryFn: () =>
      getAttendanceReport(
        selectedClassId === 'all' ? null : selectedClassId,
        fromDate,
        toDate,
        1,
        50
      ),
    enabled: !!selectedClassId,
  });

  // Update allStudents when new data arrives for page 1
  useMemo(() => {
    if (reportData?.student_wise && currentPage === 1) {
      setAllStudents(reportData.student_wise);
    }
  }, [reportData]);

  // Load more handler
  const handleLoadMore = async () => {
    if (!reportData?.pagination?.has_next || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreData = await getAttendanceReport(
        selectedClassId === 'all' ? null : selectedClassId,
        fromDate,
        toDate,
        nextPage,
        50
      );

      if (moreData.student_wise) {
        setAllStudents((prev) => [...(prev || []), ...moreData.student_wise!]);
        setCurrentPage(nextPage);
      }
    } catch {
      // Error handled silently
    } finally {
      setIsLoadingMore(false);
    }
  };

  const selectedClassName = useMemo(() => {
    if (!selectedClassId) return 'Choose a class...';
    if (selectedClassId === 'all') return '📊 All Classes (Organization)';
    if (!classes) return 'Choose a class...';
    const cls = classes.find((c) => c.public_id === selectedClassId);
    return cls?.display_name || cls?.name || 'Choose a class...';
  }, [selectedClassId, classes]);

  // Use the single reportData for both class-specific and org-wide reports
  const activeReportData = reportData;
  const isLoadingData = loadingReport;

  // Combined student list for display (includes all loaded pages)
  const displayStudents =
    allStudents && allStudents.length > 0 ? allStudents : reportData?.student_wise || [];

  // Pagination info
  const pagination = reportData?.pagination;
  const hasMorePages = pagination?.has_next || false;
  const totalStudentsCount = pagination?.total_count || displayStudents?.length || 0;
  const loadedStudentsCount = displayStudents?.length || 0;

  // Generate insights from the report data (use all loaded students for better insights)
  const insights = useMemo(() => {
    if (!activeReportData || !displayStudents || displayStudents.length === 0) {
      return null;
    }

    const students = displayStudents;
    const totalStudents = students.length;
    const totalWorkingDays = activeReportData.total_working_days;

    // Categorize students by attendance percentage
    const excellentStudents = students.filter((s) => s.percentage >= 95);
    const goodStudents = students.filter((s) => s.percentage >= 85 && s.percentage < 95);
    const atRiskStudents = students.filter((s) => s.percentage >= 75 && s.percentage < 85);
    const criticalStudents = students.filter((s) => s.percentage < 75);

    // Find patterns
    const perfectAttendance = students.filter((s) => s.percentage === 100);
    const highAbsentees = students.filter((s) => s.absent >= 3).sort((a, b) => b.absent - a.absent);
    const frequentHalfDays = students
      .filter((s) => s.half_day >= 2)
      .sort((a, b) => b.half_day - a.half_day);

    // Overall class health based on attendance percentage
    const overallPercentage = activeReportData.attendance_percentage;
    let classHealth: 'excellent' | 'good' | 'concern' | 'critical' = 'excellent';
    if (overallPercentage < 75) classHealth = 'critical';
    else if (overallPercentage < 85) classHealth = 'concern';
    else if (overallPercentage < 95) classHealth = 'good';

    return {
      classHealth,
      overallPercentage,
      totalStudents,
      totalWorkingDays,
      excellentStudents,
      goodStudents,
      atRiskStudents,
      criticalStudents,
      perfectAttendance,
      highAbsentees: highAbsentees.slice(0, 5),
      frequentHalfDays: frequentHalfDays.slice(0, 3),
      // Use the pre-calculated averages from the API response
      avgAbsent: activeReportData.avg_absent_days,
      avgHalfDay: activeReportData.avg_half_days,
      avgPresent: activeReportData.avg_present_days,
    };
  }, [activeReportData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setAllStudents([]);
    await refetch();
    setRefreshing(false);
  };

  const handlePreviousMonth = () => {
    setCurrentPage(1);
    setAllStudents([]);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      setCurrentPage(1);
      setAllStudents([]);
      setCurrentMonth(nextMonth);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return { bg: '#dcfce7', text: '#16a34a', icon: '#22c55e' };
      case 'good':
        return { bg: '#dbeafe', text: '#2563eb', icon: '#3b82f6' };
      case 'concern':
        return { bg: '#fef3c7', text: '#d97706', icon: '#f59e0b' };
      case 'critical':
        return { bg: '#fee2e2', text: '#dc2626', icon: '#ef4444' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', icon: '#9ca3af' };
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Class Selector */}
      <View style={[styles.selectorCard, { zIndex: 100 }]}>
        <View style={styles.selectorHeader}>
          <Filter size={18} color="#0d9488" />
          <Text style={styles.selectorTitle}>Select Class</Text>
        </View>
        {loadingClasses ? (
          <ActivityIndicator size="small" color="#0d9488" />
        ) : !classOptions || classOptions.length === 0 ? (
          <Text style={{ color: '#9ca3af', fontSize: 14, paddingVertical: 8 }}>
            No classes available
          </Text>
        ) : (
          <View style={{ zIndex: 100 }}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowClassPicker(!showClassPicker)}
              activeOpacity={0.7}
            >
              <Users size={18} color="#64748b" />
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedClassName}
              </Text>
              <ChevronDown
                size={18}
                color="#64748b"
                style={{ transform: [{ rotate: showClassPicker ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showClassPicker && (
              <View style={[styles.dropdownList, { zIndex: 1000 }]}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {classOptions.map((cls) => (
                    <TouchableOpacity
                      key={cls.public_id}
                      style={[
                        styles.dropdownItem,
                        selectedClassId === cls.public_id && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setCurrentPage(1);
                        setAllStudents([]);
                        setSelectedClassId(cls.public_id);
                        setShowClassPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedClassId === cls.public_id && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {cls.display_name || cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Month Navigator */}
      <View style={[styles.monthNav, { zIndex: 1 }]}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthNavButton}>
          <ChevronLeft size={20} color="#0d9488" />
        </TouchableOpacity>
        <View style={styles.monthNavCenter}>
          <CalendarDays size={18} color="#0d9488" />
          <Text style={styles.monthNavText}>{format(currentMonth, 'MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.monthNavButton}
          disabled={addMonths(currentMonth, 1) > new Date()}
        >
          <ChevronRight
            size={20}
            color={addMonths(currentMonth, 1) > new Date() ? '#d1d5db' : '#0d9488'}
          />
        </TouchableOpacity>
      </View>

      {/* Report Content */}
      {!selectedClassId ? (
        <View style={styles.emptyState}>
          <GraduationCap size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>Select a class to view report</Text>
        </View>
      ) : isLoadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Analyzing attendance data...</Text>
        </View>
      ) : activeReportData && insights ? (
        <>
          {/* Class Health Overview */}
          <View
            style={[
              styles.healthCard,
              { backgroundColor: getHealthColor(insights.classHealth).bg },
            ]}
          >
            <View style={styles.healthHeader}>
              <View style={styles.healthLeft}>
                {insights.classHealth === 'excellent' ? (
                  <Award size={28} color={getHealthColor(insights.classHealth).icon} />
                ) : insights.classHealth === 'good' ? (
                  <ThumbsUp size={28} color={getHealthColor(insights.classHealth).icon} />
                ) : insights.classHealth === 'concern' ? (
                  <AlertTriangle size={28} color={getHealthColor(insights.classHealth).icon} />
                ) : (
                  <XCircle size={28} color={getHealthColor(insights.classHealth).icon} />
                )}
                <View>
                  <Text
                    style={[
                      styles.healthTitle,
                      { color: getHealthColor(insights.classHealth).text },
                    ]}
                  >
                    {insights.classHealth === 'excellent'
                      ? 'Excellent Attendance!'
                      : insights.classHealth === 'good'
                        ? 'Good Attendance'
                        : insights.classHealth === 'concern'
                          ? 'Needs Attention'
                          : 'Critical - Action Required'}
                  </Text>
                  <Text style={styles.healthSubtitle}>
                    {insights.totalStudents} student{insights.totalStudents !== 1 ? 's' : ''} •{' '}
                    {insights.totalWorkingDays} working day
                    {insights.totalWorkingDays !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.healthPercentage}>
                <Text
                  style={[
                    styles.healthPercentageValue,
                    { color: getHealthColor(insights.classHealth).text },
                  ]}
                >
                  {insights.overallPercentage}%
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Insights Grid */}
          <View style={styles.insightsGrid}>
            <View style={[styles.insightBox, { backgroundColor: '#dcfce7' }]}>
              <View style={styles.insightHeader}>
                <CheckCircle2 size={16} color="#16a34a" />
                <Text style={[styles.insightValue, { color: '#16a34a' }]}>
                  {insights.excellentStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>≥95% Attendance</Text>
            </View>
            <View style={[styles.insightBox, { backgroundColor: '#dbeafe' }]}>
              <View style={styles.insightHeader}>
                <TrendingUp size={16} color="#2563eb" />
                <Text style={[styles.insightValue, { color: '#2563eb' }]}>
                  {insights.goodStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>85-94% Attendance</Text>
            </View>
            <View style={[styles.insightBox, { backgroundColor: '#fef3c7' }]}>
              <View style={styles.insightHeader}>
                <AlertTriangle size={16} color="#d97706" />
                <Text style={[styles.insightValue, { color: '#d97706' }]}>
                  {insights.atRiskStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>75-84% At Risk</Text>
            </View>
            <View style={[styles.insightBox, { backgroundColor: '#fee2e2' }]}>
              <View style={styles.insightHeader}>
                <XCircle size={16} color="#dc2626" />
                <Text style={[styles.insightValue, { color: '#dc2626' }]}>
                  {insights.criticalStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>&lt;75% Critical</Text>
            </View>
          </View>

          {/* Actionable Insights */}
          <View style={styles.actionSection}>
            <View style={styles.actionHeader}>
              <Lightbulb size={18} color="#f59e0b" />
              <Text style={styles.actionTitle}>Action Items</Text>
            </View>

            {/* Perfect Attendance Recognition */}
            {insights.perfectAttendance.length > 0 && (
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Award size={20} color="#16a34a" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>🎉 Recognize Perfect Attendance</Text>
                  <Text style={styles.actionCardDesc}>
                    {insights.perfectAttendance.length} student
                    {insights.perfectAttendance.length > 1 ? 's have' : ' has'} 100% attendance this
                    month
                  </Text>
                  <View style={styles.actionNames}>
                    {insights.perfectAttendance.slice(0, 3).map((s, i) => (
                      <View key={s.student_id} style={styles.nameBadge}>
                        <Text style={styles.nameBadgeText}>{s.student_name.split(' ')[0]}</Text>
                      </View>
                    ))}
                    {insights.perfectAttendance.length > 3 && (
                      <Text style={styles.moreText}>
                        +{insights.perfectAttendance.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Critical Students Alert */}
            {insights.criticalStudents.length > 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#ef4444' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                  <UserX size={20} color="#dc2626" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionCardTitle, { color: '#dc2626' }]}>
                    ⚠️ Contact Parents Immediately
                  </Text>
                  <Text style={styles.actionCardDesc}>
                    {insights.criticalStudents.length} student
                    {insights.criticalStudents.length > 1 ? 's are' : ' is'} below 75% -
                    intervention needed
                  </Text>
                  <View style={styles.criticalList}>
                    {insights.criticalStudents.slice(0, 3).map((s) => (
                      <View key={s.student_id} style={styles.criticalItem}>
                        <Text style={styles.criticalName}>{s.student_name}</Text>
                        <View style={[styles.criticalBadge, { backgroundColor: '#fee2e2' }]}>
                          <Text style={styles.criticalPercent}>{s.percentage}%</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* High Absentees */}
            {insights.highAbsentees.length > 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#f59e0b' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                  <Calendar size={20} color="#d97706" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>📋 Review High Absentees</Text>
                  <Text style={styles.actionCardDesc}>
                    Students with 3+ absences this month need follow-up
                  </Text>
                  <View style={styles.absenteeList}>
                    {insights.highAbsentees.map((s) => (
                      <View key={s.student_id} style={styles.absenteeItem}>
                        <Text style={styles.absenteeName} numberOfLines={1}>
                          {s.student_name}
                        </Text>
                        <View style={styles.absenteeStats}>
                          <XCircle size={12} color="#dc2626" />
                          <Text style={styles.absenteeCount}>{s.absent} days</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Frequent Half Days */}
            {insights.frequentHalfDays.length > 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#0d9488' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#ccfbf1' }]}>
                  <Clock size={20} color="#0d9488" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>⏰ Check Late/Early Leaving Patterns</Text>
                  <Text style={styles.actionCardDesc}>
                    {insights.frequentHalfDays.length} student
                    {insights.frequentHalfDays.length > 1 ? 's have' : ' has'} multiple half-days
                  </Text>
                  <View style={styles.halfDayList}>
                    {insights.frequentHalfDays.map((s) => (
                      <View key={s.student_id} style={styles.halfDayItem}>
                        <Text style={styles.halfDayName} numberOfLines={1}>
                          {s.student_name}
                        </Text>
                        <View style={styles.halfDayBadge}>
                          <Clock size={10} color="#d97706" />
                          <Text style={styles.halfDayCount}>{s.half_day}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* No Issues - All Good */}
            {insights.criticalStudents.length === 0 && insights.highAbsentees.length === 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#22c55e' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                  <ThumbsUp size={20} color="#16a34a" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>✅ Great Job!</Text>
                  <Text style={styles.actionCardDesc}>
                    No critical attendance issues found. Keep up the good work!
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Class Averages Summary */}
          <View style={styles.averagesCard}>
            <Text style={styles.averagesTitle}>Class Averages</Text>
            <View style={styles.averagesRow}>
              <View style={styles.averageItem}>
                <Text style={styles.averageValue}>{insights.avgAbsent}</Text>
                <Text style={styles.averageLabel}>Avg. Absences</Text>
              </View>
              <View style={styles.averageDivider} />
              <View style={styles.averageItem}>
                <Text style={styles.averageValue}>{insights.avgHalfDay}</Text>
                <Text style={styles.averageLabel}>Avg. Half Days</Text>
              </View>
              <View style={styles.averageDivider} />
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: '#0d9488' }]}>
                  {insights.overallPercentage}%
                </Text>
                <Text style={styles.averageLabel}>Attendance Rate</Text>
              </View>
            </View>
          </View>

          {/* Student-wise Breakdown - Sorted by performance */}
          {displayStudents && displayStudents.length > 0 && (
            <View style={styles.studentListCard}>
              <View style={styles.studentListHeader}>
                <View>
                  <Text style={styles.studentListTitle}>Student Performance</Text>
                  <Text style={styles.studentListSubtitle}>Sorted by attendance %</Text>
                </View>
                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    {loadedStudentsCount} of {totalStudentsCount}
                  </Text>
                </View>
              </View>
              {[...displayStudents]
                .sort((a, b) => a.percentage - b.percentage) // Sort by percentage ascending (worst first)
                .map((student, index) => (
                  <View
                    key={student.student_id}
                    style={[
                      styles.studentRow,
                      index !== displayStudents.length - 1 && styles.studentRowBorder,
                    ]}
                  >
                    <View style={styles.studentInfo}>
                      <View
                        style={[
                          styles.studentAvatar,
                          student.percentage >= 95
                            ? { backgroundColor: '#dcfce7' }
                            : student.percentage >= 85
                              ? { backgroundColor: '#dbeafe' }
                              : student.percentage >= 75
                                ? { backgroundColor: '#fef3c7' }
                                : { backgroundColor: '#fee2e2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.studentAvatarText,
                            student.percentage >= 95
                              ? { color: '#16a34a' }
                              : student.percentage >= 85
                                ? { color: '#2563eb' }
                                : student.percentage >= 75
                                  ? { color: '#d97706' }
                                  : { color: '#dc2626' },
                          ]}
                        >
                          {student.student_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {student.student_name}
                        </Text>
                        <View style={styles.studentMiniStats}>
                          <Text style={styles.miniStatText}>P:{student.present}</Text>
                          <Text style={styles.miniStatText}>A:{student.absent}</Text>
                          <Text style={styles.miniStatText}>H:{student.half_day}</Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.studentPercentageLarge,
                        student.percentage >= 95
                          ? styles.percentageGreen
                          : student.percentage >= 85
                            ? styles.percentageBlue
                            : student.percentage >= 75
                              ? styles.percentageYellow
                              : styles.percentageRed,
                      ]}
                    >
                      <Text style={styles.studentPercentageTextLarge}>{student.percentage}%</Text>
                    </View>
                  </View>
                ))}

              {/* Load More Button */}
              {hasMorePages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                  activeOpacity={0.7}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#0d9488" />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>
                        Load More ({totalStudentsCount - loadedStudentsCount} remaining)
                      </Text>
                      <ChevronDown size={18} color="#0d9488" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

export default function AttendanceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'summary' | 'report'>('summary');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0d9488', '#14b8a6', '#2dd4bf']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Attendance</Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'summary' ? 'Daily Overview' : 'Class Reports'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
            onPress={() => setActiveTab('summary')}
          >
            <TrendingUp
              size={18}
              color={activeTab === 'summary' ? '#0d9488' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
              Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'report' && styles.tabActive]}
            onPress={() => setActiveTab('report')}
          >
            <BarChart3
              size={18}
              color={activeTab === 'report' ? '#0d9488' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>
              Report
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Content */}
      <View style={styles.content}>{activeTab === 'summary' ? <SummaryTab /> : <ReportTab />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdfa' },
  header: { paddingTop: 48, paddingBottom: 0, paddingHorizontal: 16 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: 'white' },
  tabText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#0d9488' },

  content: { flex: 1 },
  tabContent: { padding: 16, paddingBottom: 100 },

  // Loading/Error States
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  loadingText: { color: '#6b7280', marginTop: 12 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  errorText: { color: '#ef4444', fontSize: 16, fontWeight: '600', marginTop: 12 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: 'white', fontWeight: '600' },

  // Date Navigation
  dateNavigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateNavButton: { padding: 8, borderRadius: 8, backgroundColor: '#f0fdfa' },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
  },
  datePickerText: { fontSize: 14, fontWeight: '600', color: '#0d9488' },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0d9488',
    borderRadius: 16,
    marginBottom: 12,
  },
  todayButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // Status Bar
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: { fontSize: 12, color: '#6b7280' },
  dateValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  holidayBadge: { backgroundColor: '#fef3c7' },
  workingBadge: { backgroundColor: '#dcfce7' },
  nonWorkingBadge: { backgroundColor: '#f3f4f6' },
  holidayBadgeText: { color: '#d97706', fontSize: 12, fontWeight: '600' },
  workingBadgeText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  nonWorkingBadgeText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },

  // Banners
  holidayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  holidayBannerTitle: { fontSize: 16, fontWeight: '700', color: '#92400e' },
  holidayBannerName: { fontSize: 13, color: '#a16207', marginTop: 2 },
  nonWorkingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  nonWorkingBannerTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  nonWorkingBannerName: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  // Stats
  statsGrid: { gap: 12, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statsHalf: { flex: 1 },
  statCard: { borderRadius: 12, padding: 14, flex: 1 },
  statCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCardTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCardValue: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginTop: 4 },
  statCardSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statCardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overall Card
  overallCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  overallValue: { color: 'white', fontSize: 36, fontWeight: '700', marginTop: 4 },

  // Progress Card
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  progressTotal: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  progressBarContainer: { marginBottom: 8 },
  progressPercentage: { fontSize: 24, fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressStats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  progressStatItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  progressStatDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  progressStatValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  progressStatLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },

  // Quick Actions
  quickActions: { marginTop: 8 },
  quickActionsTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: { flex: 1, marginLeft: 12 },
  actionButtonTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  actionButtonSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  // Report Tab Specific
  selectorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  selectorTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownText: { flex: 1, fontSize: 14, color: '#374151' },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: { backgroundColor: '#f0fdfa' },
  dropdownItemText: { fontSize: 14, color: '#374151' },
  dropdownItemTextSelected: { color: '#0d9488', fontWeight: '600' },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNavButton: { padding: 8 },
  monthNavCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthNavText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateText: { color: '#9ca3af', fontSize: 15, marginTop: 12 },

  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  percentageBadge: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: { color: 'white', fontSize: 14, fontWeight: '700' },
  reportStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { width: '31%', borderRadius: 10, padding: 12, alignItems: 'center' },
  statBoxValue: { fontSize: 20, fontWeight: '700' },
  statBoxLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },

  studentListCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  studentListTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  studentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentListSubtitle: { fontSize: 12, color: '#9ca3af' },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  studentRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 14, fontWeight: '700', color: '#0d9488' },
  studentName: { fontSize: 14, fontWeight: '500', color: '#1f2937', flex: 1 },
  studentMiniStats: { flexDirection: 'row', gap: 8, marginTop: 2 },
  miniStatText: { fontSize: 11, color: '#9ca3af' },
  studentStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  studentStatItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  studentStatText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  studentPercentage: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 4 },
  studentPercentageLarge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  studentPercentageTextLarge: { fontSize: 13, fontWeight: '700', color: '#374151' },
  percentageGreen: { backgroundColor: '#dcfce7' },
  percentageBlue: { backgroundColor: '#dbeafe' },
  percentageYellow: { backgroundColor: '#fef3c7' },
  percentageRed: { backgroundColor: '#fee2e2' },
  studentPercentageText: { fontSize: 11, fontWeight: '700', color: '#374151' },

  // Health Card
  healthCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  healthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  healthTitle: { fontSize: 16, fontWeight: '700' },
  healthSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  healthPercentage: { alignItems: 'flex-end' },
  healthPercentageValue: { fontSize: 28, fontWeight: '700' },

  // Insights Grid
  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  insightBox: { width: '48%', borderRadius: 10, padding: 12 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  insightValue: { fontSize: 22, fontWeight: '700' },
  insightLabel: { fontSize: 11, color: '#6b7280' },

  // Action Section
  actionSection: { marginBottom: 16 },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: { flex: 1 },
  actionCardTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  actionCardDesc: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  actionNames: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  nameBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nameBadgeText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  moreText: { fontSize: 11, color: '#6b7280' },

  // Critical List
  criticalList: { gap: 6 },
  criticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 8,
  },
  criticalName: { fontSize: 13, color: '#1f2937', flex: 1 },
  criticalBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  criticalPercent: { fontSize: 11, fontWeight: '700', color: '#dc2626' },

  // Absentee List
  absenteeList: { gap: 6 },
  absenteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    padding: 8,
    borderRadius: 8,
  },
  absenteeName: { fontSize: 13, color: '#1f2937', flex: 1 },
  absenteeStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  absenteeCount: { fontSize: 11, color: '#dc2626', fontWeight: '600' },

  // Half Day List
  halfDayList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  halfDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  halfDayName: { fontSize: 11, color: '#374151' },
  halfDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  halfDayCount: { fontSize: 10, color: '#d97706', fontWeight: '600' },

  // Averages Card
  averagesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  averagesTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  averagesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  averageItem: { alignItems: 'center' },
  averageValue: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  averageLabel: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  averageDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb' },

  // Pagination
  paginationInfo: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: { fontSize: 12, color: '#0d9488', fontWeight: '600' },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderStyle: 'dashed',
  },
  loadMoreText: { fontSize: 14, color: '#0d9488', fontWeight: '600' },
});
