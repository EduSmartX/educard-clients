/**
 * Employee Dashboard
 * Main dashboard for teachers and staff
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  GraduationCap,
} from 'lucide-react-native';

import { Screen } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { useAuthStore } from '@/lib/auth-store';
import { colors } from '@/constants/colors';

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
    await new Promise(resolve => setTimeout(resolve, 1000));
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.secondary[600], colors.secondary[700]]}
          className="pt-12 pb-8 px-6 rounded-b-[30px]"
        >
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-secondary-100 text-sm">
                {formatGreeting()},
              </Text>
              <Text className="text-2xl font-bold text-white" numberOfLines={1}>
                {user?.full_name || user?.first_name || 'Teacher'}
              </Text>
              <Text className="text-secondary-200 text-sm mt-1">
                Mathematics Teacher
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                onPress={() => router.push('/(tabs)/(parent)/notifications' as any)}
              >
                <Bell size={20} color="#ffffff" />
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">2</Text>
                </View>
              </TouchableOpacity>
              <Avatar name={user?.full_name || user?.first_name || 'T'} size="md" />
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row flex-wrap -mx-1.5">
            <View className="w-1/2 px-1.5 mb-3">
              <View className="bg-white/20 rounded-xl p-3">
                <View className="flex-row items-center">
                  <BookOpen size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">
                    {mockStats.classesToday}
                  </Text>
                </View>
                <Text className="text-secondary-100 text-xs mt-1">Classes Today</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5 mb-3">
              <View className="bg-white/20 rounded-xl p-3">
                <View className="flex-row items-center">
                  <Users size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">
                    {mockStats.studentsTotal}
                  </Text>
                </View>
                <Text className="text-secondary-100 text-xs mt-1">My Students</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5">
              <View className="bg-white/20 rounded-xl p-3">
                <View className="flex-row items-center">
                  <FileText size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">
                    {mockStats.pendingTasks}
                  </Text>
                </View>
                <Text className="text-secondary-100 text-xs mt-1">Pending Tasks</Text>
              </View>
            </View>
            <View className="w-1/2 px-1.5">
              <View className="bg-white/20 rounded-xl p-3">
                <View className="flex-row items-center">
                  <ClipboardCheck size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-lg ml-2">
                    {mockStats.attendanceRate}%
                  </Text>
                </View>
                <Text className="text-secondary-100 text-xs mt-1">Attendance Rate</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View className="px-4 pt-6">
          {/* Today's Classes */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Today's Classes
              </Text>
              <TouchableOpacity>
                <Text className="text-primary-600 text-sm font-medium">
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockTodayClasses.map((classItem, index) => (
                <TouchableOpacity
                  key={classItem.id}
                  className={`flex-row items-center py-3 ${
                    index !== mockTodayClasses.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View
                    className="w-1 h-12 rounded-full mr-3"
                    style={{ backgroundColor: getStatusColor(classItem.status) }}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 font-medium">
                        {classItem.subject}
                      </Text>
                      <Text className="text-gray-500 text-sm ml-2">
                        ({classItem.class})
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-sm">
                      {classItem.time}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {classItem.room}
                    </Text>
                  </View>
                  {classItem.status === 'completed' && (
                    <CheckCircle size={20} color={colors.success[500]} />
                  )}
                  {classItem.status === 'ongoing' && (
                    <Badge variant="primary" size="sm">Live</Badge>
                  )}
                  {classItem.status === 'upcoming' && (
                    <Clock size={20} color={colors.gray[400]} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>

          {/* Pending Tasks */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Pending Tasks
              </Text>
              <TouchableOpacity>
                <Text className="text-primary-600 text-sm font-medium">
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockPendingTasks.map((task, index) => (
                <TouchableOpacity
                  key={task.id}
                  className={`flex-row items-center py-3 ${
                    index !== mockPendingTasks.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                    <FileText size={18} color={colors.gray[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {task.title}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Due: {task.dueDate}
                    </Text>
                  </View>
                  <Badge 
                    variant={getPriorityColor(task.priority) as any} 
                    size="sm"
                  >
                    {task.priority}
                  </Badge>
                </TouchableOpacity>
              ))}
            </Card>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap -mx-1.5">
              <TouchableOpacity className="w-1/3 px-1.5 mb-3">
                <View className="bg-primary-50 rounded-2xl p-4 items-center">
                  <ClipboardCheck size={28} color={colors.primary[600]} strokeWidth={1.5} />
                  <Text className="text-primary-700 text-sm font-medium mt-2 text-center">
                    Mark{'\n'}Attendance
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="w-1/3 px-1.5 mb-3">
                <View className="bg-success-50 rounded-2xl p-4 items-center">
                  <GraduationCap size={28} color={colors.success[600]} strokeWidth={1.5} />
                  <Text className="text-success-700 text-sm font-medium mt-2 text-center">
                    Enter{'\n'}Marks
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="w-1/3 px-1.5 mb-3">
                <View className="bg-warning-50 rounded-2xl p-4 items-center">
                  <Calendar size={28} color={colors.warning[600]} strokeWidth={1.5} />
                  <Text className="text-warning-700 text-sm font-medium mt-2 text-center">
                    Apply{'\n'}Leave
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
