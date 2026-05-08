/**
 * Employee Dashboard
 * Main dashboard for teachers and staff with real timetable data
 */

import { getSubjectColor } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  ClipboardCheck,
  Clock,
  Bell,
  Calendar,
  CheckCircle,
  GraduationCap,
  CalendarDays,
  Plus,
  AlertCircle,
} from 'lucide-react-native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { Screen } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { colors } from '@/constants/colors';
import { useMyTimetable } from '@/features/timetable';
import type { TimetableEntry } from '@/features/timetable';
import { useAuthStore } from '@/lib/auth-store';

// Day labels (0=Monday, 6=Sunday)
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentEntryLayout, setCurrentEntryLayout] = useState<{
    y: number;
    height: number;
  } | null>(null);

  // Fetch real timetable data
  const { data: timetableData, isLoading, refetch } = useMyTimetable();

  // Get today's day index (0=Monday, 6=Sunday)
  const todayDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  // Get today's classes sorted by time
  const todayClasses = useMemo((): TimetableEntry[] => {
    if (!timetableData?.days) return [];
    const entries =
      timetableData.days[todayDayNum] || timetableData.days[String(todayDayNum)] || [];
    return [...entries].sort((a, b) => {
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      return timeA.localeCompare(timeB);
    });
  }, [timetableData, todayDayNum]);

  // Determine class status: completed, ongoing, or upcoming
  const getClassStatus = useCallback((entry: TimetableEntry) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (entry.start_time || '00:00').split(':').map(Number);
    const [endH, endM] = (entry.end_time || '00:00').split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= endMinutes) return 'completed';
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return 'ongoing';
    return 'upcoming';
  }, []);

  // Find current or next upcoming class
  const currentOrNextEntry = useMemo(() => {
    for (const entry of todayClasses) {
      const status = getClassStatus(entry);
      if (status === 'ongoing' || status === 'upcoming') {
        return { entry, status };
      }
    }
    return null;
  }, [todayClasses, getClassStatus]);

  // Auto-scroll to current/next class on mount and when data changes
  useEffect(() => {
    if (currentEntryLayout && scrollViewRef.current) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: currentEntryLayout.y - 100,
          animated: true,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentEntryLayout]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Count stats from timetable
  const stats = useMemo(
    () => ({
      classesToday: todayClasses.length,
      completedToday: todayClasses.filter((e) => getClassStatus(e) === 'completed').length,
      remainingToday: todayClasses.filter((e) => getClassStatus(e) !== 'completed').length,
    }),
    [todayClasses, getClassStatus]
  );

  return (
    <Screen scrollable={false}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.secondary[600], colors.secondary[700]]}
          className="rounded-b-[30px] px-6 pb-8 pt-12"
        >
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-sm text-secondary-100">{formatGreeting()},</Text>
              <Text className="text-2xl font-bold text-white" numberOfLines={1}>
                {user?.full_name ?? user?.first_name ?? 'Teacher'}
              </Text>
              <Text className="mt-1 text-sm text-secondary-200">
                {timetableData?.teacher_name ?? 'Teacher'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
                onPress={() => router.push('/(tabs)/(parent)/notifications' as any)}
              >
                <Bell size={20} color="#ffffff" />
              </TouchableOpacity>
              <Avatar name={user?.full_name ?? user?.first_name ?? 'T'} size="md" />
            </View>
          </View>

          {/* Stats Row */}
          <View className="-mx-1.5 flex-row flex-wrap">
            <View className="mb-3 w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <BookOpen size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">{stats.classesToday}</Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Classes Today</Text>
              </View>
            </View>
            <View className="mb-3 w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <CheckCircle size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">{stats.completedToday}</Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Completed</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <Clock size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">{stats.remainingToday}</Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Remaining</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <Calendar size={18} color="#ffffff" />
                  <Text className="ml-2 text-sm font-bold text-white">
                    {DAY_LABELS[todayDayNum]}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Today</Text>
              </View>
            </View>
          </View>

          {/* Next Class Banner */}
          {currentOrNextEntry && (
            <View className="mt-4 rounded-xl bg-white/25 p-3">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/30">
                  {currentOrNextEntry.status === 'ongoing' ? (
                    <AlertCircle size={20} color="#fff" />
                  ) : (
                    <Clock size={20} color="#fff" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-white/80">
                    {currentOrNextEntry.status === 'ongoing' ? 'Currently Teaching' : 'Next Class'}
                  </Text>
                  <Text className="font-semibold text-white">
                    {currentOrNextEntry.entry.subject_name ?? currentOrNextEntry.entry.slot_label}
                  </Text>
                  <Text className="text-xs text-white/80">
                    {currentOrNextEntry.entry.class_name} •{' '}
                    {formatTime(currentOrNextEntry.entry.start_time)} -{' '}
                    {formatTime(currentOrNextEntry.entry.end_time)}
                  </Text>
                </View>
                <View
                  className={`rounded px-2 py-1 ${currentOrNextEntry.status === 'ongoing' ? 'bg-white' : 'bg-white/30'}`}
                >
                  <Text
                    className={
                      currentOrNextEntry.status === 'ongoing'
                        ? 'text-xs font-medium text-primary-600'
                        : 'text-xs text-white'
                    }
                  >
                    {currentOrNextEntry.status === 'ongoing' ? 'Live' : 'Up Next'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Content */}
        <View className="px-4 pt-6">
          {/* Today's Classes */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                Today's Schedule — {DAY_LABELS[todayDayNum]}
              </Text>
            </View>

            {isLoading ? (
              <Card className="items-center justify-center py-8">
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text className="mt-2 text-sm text-gray-500">Loading schedule...</Text>
              </Card>
            ) : todayClasses.length === 0 ? (
              <Card className="items-center justify-center py-8">
                <Calendar size={48} color={colors.gray[300]} />
                <Text className="mt-2 text-sm text-gray-500">No classes scheduled for today</Text>
              </Card>
            ) : (
              <Card>
                {todayClasses.map((entry, index) => {
                  const status = getClassStatus(entry);
                  const isCurrentOrNext = currentOrNextEntry?.entry.public_id === entry.public_id;
                  const subjectColor = getSubjectColor(
                    entry.subject_name ?? entry.slot_label ?? 'default'
                  );

                  return (
                    <TouchableOpacity
                      key={entry.public_id || index}
                      onLayout={(e) => {
                        if (isCurrentOrNext) {
                          setCurrentEntryLayout({
                            y: e.nativeEvent.layout.y,
                            height: e.nativeEvent.layout.height,
                          });
                        }
                      }}
                      className={`flex-row items-center py-3 ${
                        index !== todayClasses.length - 1 ? 'border-b border-gray-100' : ''
                      } ${isCurrentOrNext ? '-mx-4 rounded-lg bg-primary-50 px-4' : ''}`}
                    >
                      <View
                        className="mr-3 h-12 w-1 rounded-full"
                        style={{ backgroundColor: subjectColor.hex }}
                      />
                      <View className="mr-3 w-16 items-center">
                        <Text
                          className={`text-sm font-semibold ${isCurrentOrNext ? 'text-primary-700' : 'text-gray-700'}`}
                        >
                          {formatTime(entry.start_time)}
                        </Text>
                        <Text className="text-xs text-gray-400">{formatTime(entry.end_time)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`font-medium ${isCurrentOrNext ? 'text-primary-900' : 'text-gray-900'}`}
                        >
                          {entry.subject_name ?? entry.slot_label}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {entry.class_name}
                          {entry.room && ` • ${entry.room}`}
                        </Text>
                      </View>
                      {status === 'completed' && (
                        <CheckCircle size={20} color={colors.success[500]} />
                      )}
                      {status === 'ongoing' && (
                        <Badge variant="primary" size="sm">
                          Live
                        </Badge>
                      )}
                      {status === 'upcoming' && <Clock size={20} color={colors.gray[400]} />}
                    </TouchableOpacity>
                  );
                })}
              </Card>
            )}
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</Text>
            <View className="-mx-1.5 flex-row flex-wrap">
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/attendance/mark')}
              >
                <View className="items-center rounded-2xl bg-primary-50 p-4">
                  <ClipboardCheck size={28} color={colors.primary[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-primary-700">
                    Mark{'\n'}Attendance
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/exams/marks')}
              >
                <View className="items-center rounded-2xl bg-success-50 p-4">
                  <GraduationCap size={28} color={colors.success[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-success-700">
                    Enter{'\n'}Marks
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/leave/my-requests')}
              >
                <View className="relative items-center rounded-2xl bg-warning-50 p-4">
                  <CalendarDays size={28} color={colors.warning[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-warning-700">
                    My{'\n'}Leaves
                  </Text>
                  <TouchableOpacity
                    className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-warning-500"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push('/(admin-screens)/leave/apply');
                    }}
                  >
                    <Plus size={14} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/timesheets/my-submissions')}
              >
                <View className="items-center rounded-2xl bg-secondary-50 p-4">
                  <Clock size={28} color={colors.secondary[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-secondary-700">
                    My{'\n'}Timesheet
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
