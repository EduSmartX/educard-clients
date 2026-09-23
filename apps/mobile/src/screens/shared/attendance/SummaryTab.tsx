import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CalendarDays,
  Calendar,
  ClipboardCheck,
  PartyPopper,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { getDashboardStats } from '@/features/attendance/api/dashboard-api';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';

import { ProgressBar } from './ProgressBar';
import { StatCard } from './StatCard';
import { styles } from './styles';

export function SummaryTab() {
  const navigation = useNavigation<SharedStackNavigation>();
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

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday =
    format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const displayDate = data?.date
    ? format(new Date(data.date + 'T00:00:00'), 'EEEE, dd MMMM yyyy')
    : format(selectedDate, 'EEEE, dd MMMM yyyy');

  const totalStudents = data?.students.total_registered ?? 0;
  const totalEmployees = data?.employees.total_registered ?? 0;
  const totalPresent =
    (data?.students.present ?? 0) + (data?.employees.present ?? 0);
  const totalMarked =
    (data?.students.marked ?? 0) + (data?.employees.marked ?? 0);

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
        <TouchableOpacity
          onPress={() => {
            void handleRefresh();
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  let dayStatusText = 'Non-Working Day';
  let dayBadgeStyle = styles.nonWorkingBadge;
  if (data?.is_holiday) {
    dayStatusText = data.holiday_name || 'Holiday';
    dayBadgeStyle = styles.holidayBadge;
  } else if (data?.is_working_day) {
    dayStatusText = 'Working Day';
    dayBadgeStyle = styles.workingBadge;
  }

  const renderDayBadgeContent = () => {
    if (data?.is_holiday) {
      return (
        <>
          <Calendar size={14} color="#d97706" />
          <Text style={styles.holidayBadgeText}>Holiday</Text>
        </>
      );
    }
    if (data?.is_working_day) {
      return (
        <>
          <CheckCircle2 size={14} color="#16a34a" />
          <Text style={styles.workingBadgeText}>Working Day</Text>
        </>
      );
    }
    return (
      <>
        <XCircle size={14} color="#6b7280" />
        <Text style={styles.nonWorkingBadgeText}>Non-Working</Text>
      </>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Date Navigation */}
      <View style={styles.dateNavigationBar}>
        <TouchableOpacity
          onPress={goToPreviousDay}
          style={styles.dateNavButton}
        >
          <ChevronLeft size={20} color="#0d9488" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.datePickerButton}
        >
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
            <Text style={styles.dateLabel}>
              {isToday ? "Today's Status" : 'Day Status'}
            </Text>
            <Text style={styles.dateValue}>{dayStatusText}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, dayBadgeStyle]}>
          {renderDayBadgeContent()}
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
              {isToday
                ? 'Attendance not required today'
                : 'Attendance not required on this day'}
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
                <StatCard
                  title="Present"
                  value={totalPresent}
                  icon={TrendingUp}
                  color="green"
                />
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
                <Text style={styles.overallValue}>
                  {data.overall_attendance_percentage}%
                </Text>
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
          onPress={() => navigation.navigate('AttendanceMark')}
        >
          <View style={styles.actionButtonIcon}>
            <ClipboardCheck size={20} color="#0d9488" />
          </View>
          <View style={styles.actionButtonText}>
            <Text style={styles.actionButtonTitle}>Mark Attendance</Text>
            <Text style={styles.actionButtonSubtitle}>
              Mark student attendance for a class
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
