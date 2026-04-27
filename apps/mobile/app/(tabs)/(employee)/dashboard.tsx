/**
 * Employee Dashboard
 * Main dashboard for teachers and staff
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Clock,
  Bell,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';

import { Screen } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth-store';

// Mock data
const mockStats = {
  classesToday: 6,
  studentsTotal: 180,
  pendingTasks: 3,
  attendanceRate: 96.2,
};

const mockTodayClasses = [
  {
    id: 1,
    subject: 'Mathematics',
    class: '10A',
    time: '9:00 AM - 9:45 AM',
    room: 'Room 201',
    status: 'completed',
  },
  {
    id: 2,
    subject: 'Mathematics',
    class: '9B',
    time: '10:00 AM - 10:45 AM',
    room: 'Room 203',
    status: 'completed',
  },
  {
    id: 3,
    subject: 'Science',
    class: '8A',
    time: '11:00 AM - 11:45 AM',
    room: 'Lab 1',
    status: 'ongoing',
  },
  {
    id: 4,
    subject: 'Mathematics',
    class: '7A',
    time: '2:00 PM - 2:45 PM',
    room: 'Room 105',
    status: 'upcoming',
  },
];

const mockPendingTasks = [
  {
    id: 1,
    title: 'Submit Class 10 Progress Report',
    dueDate: 'Today',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Review Class 9 Assignments',
    dueDate: 'Tomorrow',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Prepare Unit Test Papers',
    dueDate: 'In 3 days',
    priority: 'low',
  },
];

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success[500];
      case 'ongoing':
        return colors.primary[500];
      case 'upcoming':
        return colors.gray[400];
      default:
        return colors.gray[400];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Screen scrollable={false}>
      <ScrollView
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
                {user?.full_name || user?.first_name || 'Teacher'}
              </Text>
              <Text className="mt-1 text-sm text-secondary-200">Mathematics Teacher</Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20"
                onPress={() => router.push('/(tabs)/(parent)/notifications' as any)}
              >
                <Bell size={20} color="#ffffff" />
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-danger-500">
                  <Text className="text-xs font-bold text-white">2</Text>
                </View>
              </TouchableOpacity>
              <Avatar name={user?.full_name || user?.first_name || 'T'} size="md" />
            </View>
          </View>

          {/* Stats Row */}
          <View className="-mx-1.5 flex-row flex-wrap">
            <View className="mb-3 w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <BookOpen size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">
                    {mockStats.classesToday}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Classes Today</Text>
              </View>
            </View>
            <View className="mb-3 w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <Users size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">
                    {mockStats.studentsTotal}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">My Students</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <FileText size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">
                    {mockStats.pendingTasks}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Pending Tasks</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5">
              <View className="rounded-xl bg-white/20 p-3">
                <View className="flex-row items-center">
                  <ClipboardCheck size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">
                    {mockStats.attendanceRate}%
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-secondary-100">Attendance Rate</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View className="px-4 pt-6">
          {/* Today's Classes */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Today's Classes</Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium text-primary-600">View All</Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockTodayClasses.map((classItem, index) => (
                <TouchableOpacity
                  key={classItem.id}
                  className={`flex-row items-center py-3 ${
                    index !== mockTodayClasses.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View
                    className="mr-3 h-12 w-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(classItem.status) }}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-medium text-gray-900">{classItem.subject}</Text>
                      <Text className="ml-2 text-sm text-gray-500">({classItem.class})</Text>
                    </View>
                    <Text className="text-sm text-gray-500">{classItem.time}</Text>
                    <Text className="text-xs text-gray-400">{classItem.room}</Text>
                  </View>
                  {classItem.status === 'completed' && (
                    <CheckCircle size={20} color={colors.success[500]} />
                  )}
                  {classItem.status === 'ongoing' && (
                    <Badge variant="primary" size="sm">
                      Live
                    </Badge>
                  )}
                  {classItem.status === 'upcoming' && <Clock size={20} color={colors.gray[400]} />}
                </TouchableOpacity>
              ))}
            </Card>
          </View>

          {/* Pending Tasks */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Pending Tasks</Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium text-primary-600">View All</Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockPendingTasks.map((task, index) => (
                <TouchableOpacity
                  key={task.id}
                  className={`flex-row items-center py-3 ${
                    index !== mockPendingTasks.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <FileText size={18} color={colors.gray[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{task.title}</Text>
                    <Text className="text-sm text-gray-500">Due: {task.dueDate}</Text>
                  </View>
                  <Badge variant={getPriorityColor(task.priority) as any} size="sm">
                    {task.priority}
                  </Badge>
                </TouchableOpacity>
              ))}
            </Card>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</Text>
            <View className="-mx-1.5 flex-row flex-wrap">
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/leave/apply' as any)}
              >
                <View className="items-center rounded-2xl bg-warning-50 p-4">
                  <Calendar size={28} color={colors.warning[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-warning-700">
                    Apply{'\n'}Leave
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/leave/my-requests' as any)}
              >
                <View className="items-center rounded-2xl bg-primary-50 p-4">
                  <FileText size={28} color={colors.primary[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-primary-700">
                    My{'\n'}Leave
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="mb-3 w-1/3 px-1.5"
                onPress={() => router.push('/(admin-screens)/timesheets/my-submissions' as any)}
              >
                <View className="items-center rounded-2xl bg-success-50 p-4">
                  <ClipboardCheck size={28} color={colors.success[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-success-700">
                    My{'\n'}Timesheets
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
