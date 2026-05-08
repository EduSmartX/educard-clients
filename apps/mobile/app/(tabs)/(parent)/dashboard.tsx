/**
 * Parent Dashboard
 * Main dashboard for parents to view their children's information
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  Calendar,
  CreditCard,
  MessageCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';

import { Screen } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth-store';

// Mock data
const mockChildren = [
  {
    id: 1,
    name: 'Arjun Kumar',
    class: '10A',
    rollNo: '15',
    photo: null,
  },
  {
    id: 2,
    name: 'Priya Kumar',
    class: '7B',
    rollNo: '22',
    photo: null,
  },
];

const mockSelectedChild = {
  attendance: 94.5,
  grade: 'A',
  rank: 5,
  pendingFees: 15000,
};

const mockRecentMarks = [
  { subject: 'Mathematics', marks: 92, total: 100, date: 'Mar 15' },
  { subject: 'Science', marks: 88, total: 100, date: 'Mar 14' },
  { subject: 'English', marks: 85, total: 100, date: 'Mar 13' },
];

const mockAnnouncements = [
  {
    id: 1,
    title: 'Annual Day Celebration',
    message: 'Annual day celebration on March 25th. All parents are invited.',
    date: 'Today',
    type: 'event',
  },
  {
    id: 2,
    title: 'PTM Meeting',
    message: 'Parent-Teacher meeting scheduled for March 20th.',
    date: 'Yesterday',
    type: 'meeting',
  },
];

const mockUpcomingEvents = [
  { id: 1, title: 'Unit Test 3', date: 'Mar 22', type: 'exam' },
  { id: 2, title: 'Sports Day', date: 'Mar 28', type: 'event' },
  { id: 3, title: 'Fee Deadline', date: 'Mar 31', type: 'fee' },
];

export default function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [showChildSelector, setShowChildSelector] = useState(false);

  const selectedChild = mockChildren[selectedChildIndex];

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

  return (
    <Screen scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.success[600], colors.success[700]]}
          className="rounded-b-[30px] px-6 pb-6 pt-12"
        >
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-sm text-green-100">{formatGreeting()},</Text>
              <Text className="text-2xl font-bold text-white" numberOfLines={1}>
                {user?.full_name ?? user?.first_name ?? 'Parent'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20"
                onPress={() => router.push('/(admin-screens)/notifications')}
              >
                <Bell size={20} color="#ffffff" />
                <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-danger-500">
                  <Text className="text-xs font-bold text-white">2</Text>
                </View>
              </TouchableOpacity>
              <Avatar name={user?.full_name ?? user?.first_name ?? 'P'} size="md" />
            </View>
          </View>

          {/* Child Selector */}
          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-white/20 p-3"
            onPress={() => setShowChildSelector(!showChildSelector)}
          >
            <Avatar name={selectedChild.name} size="md" />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-white">{selectedChild.name}</Text>
              <Text className="text-green-100">
                Class {selectedChild.class} • Roll No. {selectedChild.rollNo}
              </Text>
            </View>
            <ChevronDown size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* Child Selector Dropdown */}
          {showChildSelector && mockChildren.length > 1 && (
            <View className="mt-2 overflow-hidden rounded-xl bg-white">
              {mockChildren.map((child, index) => (
                <TouchableOpacity
                  key={child.id}
                  className={`flex-row items-center p-3 ${
                    index !== mockChildren.length - 1 ? 'border-b border-gray-100' : ''
                  } ${index === selectedChildIndex ? 'bg-primary-50' : ''}`}
                  onPress={() => {
                    setSelectedChildIndex(index);
                    setShowChildSelector(false);
                  }}
                >
                  <Avatar name={child.name} size="sm" />
                  <View className="ml-3 flex-1">
                    <Text className="font-medium text-gray-900">{child.name}</Text>
                    <Text className="text-sm text-gray-500">Class {child.class}</Text>
                  </View>
                  {index === selectedChildIndex && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-500">
                      <Text className="text-xs text-white">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Stats Row */}
        <View className="-mt-4 px-4">
          <View className="-mx-1.5 flex-row flex-wrap">
            <View className="mb-3 w-1/2 px-1.5">
              <Card className="items-center py-4">
                <ClipboardCheck size={24} color={colors.success[500]} strokeWidth={1.5} />
                <Text className="mt-2 text-2xl font-bold text-gray-900">
                  {mockSelectedChild.attendance}%
                </Text>
                <Text className="text-xs text-gray-500">Attendance</Text>
              </Card>
            </View>
            <View className="mb-3 w-1/2 px-1.5">
              <Card className="items-center py-4">
                <Award size={24} color={colors.primary[500]} strokeWidth={1.5} />
                <Text className="mt-2 text-2xl font-bold text-gray-900">
                  {mockSelectedChild.grade}
                </Text>
                <Text className="text-xs text-gray-500">Grade</Text>
              </Card>
            </View>
            <View className="w-1/2 px-1.5">
              <Card className="items-center py-4">
                <Star size={24} color={colors.warning[500]} strokeWidth={1.5} />
                <Text className="mt-2 text-2xl font-bold text-gray-900">
                  #{mockSelectedChild.rank}
                </Text>
                <Text className="text-xs text-gray-500">Class Rank</Text>
              </Card>
            </View>
            <View className="w-1/2 px-1.5">
              <Card className="items-center py-4">
                <CreditCard size={24} color={colors.danger[500]} strokeWidth={1.5} />
                <Text className="mt-2 text-2xl font-bold text-gray-900">
                  ₹{(mockSelectedChild.pendingFees / 1000).toFixed(0)}K
                </Text>
                <Text className="text-xs text-gray-500">Pending Fees</Text>
              </Card>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 pt-4">
          {/* Announcements */}
          {mockAnnouncements.length > 0 && (
            <View className="mb-6">
              <TouchableOpacity className="flex-row items-center rounded-xl border border-primary-200 bg-primary-50 p-4">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <AlertCircle size={20} color={colors.primary[600]} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-primary-800">
                    {mockAnnouncements[0].title}
                  </Text>
                  <Text className="text-sm text-primary-600" numberOfLines={1}>
                    {mockAnnouncements[0].message}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.primary[400]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Recent Marks */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Recent Marks</Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium text-primary-600">View All</Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockRecentMarks.map((mark, index) => (
                <View
                  key={index}
                  className={`flex-row items-center py-3 ${
                    index !== mockRecentMarks.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                    <BookOpen size={18} color={colors.primary[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{mark.subject}</Text>
                    <Text className="text-sm text-gray-500">{mark.date}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-primary-600">
                      {mark.marks}/{mark.total}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {Math.round((mark.marks / mark.total) * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          {/* Upcoming Events */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Upcoming Events</Text>
              <TouchableOpacity>
                <Text className="text-sm font-medium text-primary-600">View Calendar</Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockUpcomingEvents.map((event, index) => (
                <View
                  key={event.id}
                  className={`flex-row items-center py-3 ${
                    index !== mockUpcomingEvents.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="mr-3 w-12 items-center">
                    <Text className="text-xs text-gray-400">{event.date.split(' ')[0]}</Text>
                    <Text className="text-lg font-bold text-gray-900">
                      {event.date.split(' ')[1]}
                    </Text>
                  </View>
                  <View
                    className="mr-3 h-10 w-1 rounded-full"
                    style={{
                      backgroundColor:
                        event.type === 'exam'
                          ? colors.warning[500]
                          : event.type === 'fee'
                            ? colors.danger[500]
                            : colors.primary[500],
                    }}
                  />
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{event.title}</Text>
                    <Badge
                      variant={
                        event.type === 'exam'
                          ? 'warning'
                          : event.type === 'fee'
                            ? 'danger'
                            : 'primary'
                      }
                      size="sm"
                    >
                      {event.type}
                    </Badge>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</Text>
            <View className="-mx-1.5 flex-row flex-wrap">
              <TouchableOpacity className="mb-3 w-1/3 px-1.5">
                <View className="items-center rounded-2xl bg-primary-50 p-4">
                  <MessageCircle size={28} color={colors.primary[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-primary-700">
                    Message{'\n'}Teacher
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="mb-3 w-1/3 px-1.5">
                <View className="items-center rounded-2xl bg-success-50 p-4">
                  <CreditCard size={28} color={colors.success[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-success-700">
                    Pay{'\n'}Fees
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="mb-3 w-1/3 px-1.5">
                <View className="items-center rounded-2xl bg-warning-50 p-4">
                  <Calendar size={28} color={colors.warning[600]} strokeWidth={1.5} />
                  <Text className="mt-2 text-center text-sm font-medium text-warning-700">
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
