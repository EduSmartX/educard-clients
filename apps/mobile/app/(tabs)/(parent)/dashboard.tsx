/**
 * Parent Dashboard
 * Main dashboard for parents to view their children's information
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  CreditCard,
  MessageCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
} from 'lucide-react-native';

import { Screen } from '@/components/layout';
import { Card, Avatar, Badge } from '@/components/ui';
import { useAuthStore } from '@/lib/auth-store';
import { colors } from '@/constants/colors';

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
    await new Promise(resolve => setTimeout(resolve, 1000));
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.success[600], colors.success[700]]}
          className="pt-12 pb-6 px-6 rounded-b-[30px]"
        >
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-green-100 text-sm">
                {formatGreeting()},
              </Text>
              <Text className="text-2xl font-bold text-white" numberOfLines={1}>
                {user?.full_name || user?.first_name || 'Parent'}
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
              <Avatar name={user?.full_name || user?.first_name || 'P'} size="md" />
            </View>
          </View>

          {/* Child Selector */}
          <TouchableOpacity
            className="bg-white/20 rounded-xl p-3 flex-row items-center"
            onPress={() => setShowChildSelector(!showChildSelector)}
          >
            <Avatar name={selectedChild.name} size="md" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold text-lg">
                {selectedChild.name}
              </Text>
              <Text className="text-green-100">
                Class {selectedChild.class} • Roll No. {selectedChild.rollNo}
              </Text>
            </View>
            <ChevronDown size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* Child Selector Dropdown */}
          {showChildSelector && mockChildren.length > 1 && (
            <View className="bg-white rounded-xl mt-2 overflow-hidden">
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
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 font-medium">{child.name}</Text>
                    <Text className="text-gray-500 text-sm">
                      Class {child.class}
                    </Text>
                  </View>
                  {index === selectedChildIndex && (
                    <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Stats Row */}
        <View className="px-4 -mt-4">
          <View className="flex-row flex-wrap -mx-1.5">
            <View className="w-1/2 px-1.5 mb-3">
              <Card className="items-center py-4">
                <ClipboardCheck size={24} color={colors.success[500]} strokeWidth={1.5} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {mockSelectedChild.attendance}%
                </Text>
                <Text className="text-gray-500 text-xs">Attendance</Text>
              </Card>
            </View>
            <View className="w-1/2 px-1.5 mb-3">
              <Card className="items-center py-4">
                <Award size={24} color={colors.primary[500]} strokeWidth={1.5} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  {mockSelectedChild.grade}
                </Text>
                <Text className="text-gray-500 text-xs">Grade</Text>
              </Card>
            </View>
            <View className="w-1/2 px-1.5">
              <Card className="items-center py-4">
                <Star size={24} color={colors.warning[500]} strokeWidth={1.5} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  #{mockSelectedChild.rank}
                </Text>
                <Text className="text-gray-500 text-xs">Class Rank</Text>
              </Card>
            </View>
            <View className="w-1/2 px-1.5">
              <Card className="items-center py-4">
                <CreditCard size={24} color={colors.danger[500]} strokeWidth={1.5} />
                <Text className="text-2xl font-bold text-gray-900 mt-2">
                  ₹{(mockSelectedChild.pendingFees / 1000).toFixed(0)}K
                </Text>
                <Text className="text-gray-500 text-xs">Pending Fees</Text>
              </Card>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 pt-4">
          {/* Announcements */}
          {mockAnnouncements.length > 0 && (
            <View className="mb-6">
              <TouchableOpacity className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex-row items-center">
                <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                  <AlertCircle size={20} color={colors.primary[600]} />
                </View>
                <View className="flex-1">
                  <Text className="text-primary-800 font-semibold">
                    {mockAnnouncements[0].title}
                  </Text>
                  <Text className="text-primary-600 text-sm" numberOfLines={1}>
                    {mockAnnouncements[0].message}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.primary[400]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Recent Marks */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Recent Marks
              </Text>
              <TouchableOpacity>
                <Text className="text-primary-600 text-sm font-medium">
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockRecentMarks.map((mark, index) => (
                <View
                  key={index}
                  className={`flex-row items-center py-3 ${
                    index !== mockRecentMarks.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View className="w-10 h-10 bg-primary-50 rounded-full items-center justify-center mr-3">
                    <BookOpen size={18} color={colors.primary[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {mark.subject}
                    </Text>
                    <Text className="text-gray-500 text-sm">{mark.date}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary-600 font-bold text-lg">
                      {mark.marks}/{mark.total}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {Math.round((mark.marks / mark.total) * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          {/* Upcoming Events */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Upcoming Events
              </Text>
              <TouchableOpacity>
                <Text className="text-primary-600 text-sm font-medium">
                  View Calendar
                </Text>
              </TouchableOpacity>
            </View>

            <Card>
              {mockUpcomingEvents.map((event, index) => (
                <View
                  key={event.id}
                  className={`flex-row items-center py-3 ${
                    index !== mockUpcomingEvents.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View className="w-12 items-center mr-3">
                    <Text className="text-gray-400 text-xs">
                      {event.date.split(' ')[0]}
                    </Text>
                    <Text className="text-gray-900 font-bold text-lg">
                      {event.date.split(' ')[1]}
                    </Text>
                  </View>
                  <View
                    className="w-1 h-10 rounded-full mr-3"
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
                    <Text className="text-gray-900 font-medium">
                      {event.title}
                    </Text>
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
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap -mx-1.5">
              <TouchableOpacity className="w-1/3 px-1.5 mb-3">
                <View className="bg-primary-50 rounded-2xl p-4 items-center">
                  <MessageCircle size={28} color={colors.primary[600]} strokeWidth={1.5} />
                  <Text className="text-primary-700 text-sm font-medium mt-2 text-center">
                    Message{'\n'}Teacher
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="w-1/3 px-1.5 mb-3">
                <View className="bg-success-50 rounded-2xl p-4 items-center">
                  <CreditCard size={28} color={colors.success[600]} strokeWidth={1.5} />
                  <Text className="text-success-700 text-sm font-medium mt-2 text-center">
                    Pay{'\n'}Fees
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
