/**
 * Parent Dashboard
 * Main dashboard for parents to view their children's information
 */

import { useNavigation } from '@react-navigation/native';
import {
  BookOpen,
  ClipboardCheck,
  Calendar,
  CalendarClock,
  CreditCard,
  MessageCircle,
  Megaphone,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import {
  VerificationBanner,
  StatsGrid,
  type StatCardData,
} from '@/components/dashboard';
import { Screen } from '@/components/layout';
import {
  Avatar,
  Badge,
  GradientHeader,
  FloatingCard,
  SectionHeader,
  QuickActionsGrid,
  PressableScale,
  type QuickAction,
} from '@/components/ui';
import { colors } from '@/constants/colors';
import { useProfileImageUrl } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import type { ParentTabNavigation } from '@/navigation/types';

const EVENT_TYPE_CONFIG: Record<
  string,
  { color: string; variant: 'warning' | 'danger' | 'primary' }
> = {
  exam: { color: colors.warning[500], variant: 'warning' },
  fee: { color: colors.danger[500], variant: 'danger' },
};

const getEventConfig = (type: string) =>
  EVENT_TYPE_CONFIG[type] || {
    color: colors.primary[500],
    variant: 'primary' as const,
  };

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

export default function ParentDashboardScreen() {
  const navigation = useNavigation<ParentTabNavigation>();
  const { user } = useAuthStore();
  const { profileImageUrl } = useProfileImageUrl();
  const [imgError, setImgError] = useState(false);
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

  // Message-teacher and event-calendar destinations are not part of the app yet.
  const pendingScreen = () => undefined;
  const goToNotifications = () => navigation.navigate('Notifications');
  const goToSettings = () => navigation.navigate('Settings');
  const goToFees = () => navigation.navigate('Fees');
  const goToAcademics = () => navigation.navigate('Academics');

  const parentStats: StatCardData[] = [
    {
      id: 'attendance',
      title: 'Attendance',
      value: `${mockSelectedChild.attendance}%`,
      icon: ClipboardCheck,
      gradient: ['#10b981', '#059669', '#047857'],
      shadowColor: '#059669',
    },
    {
      id: 'grade',
      title: 'Grade',
      value: mockSelectedChild.grade,
      icon: Award,
      gradient: ['#667eea', '#764ba2', '#8b5cf6'],
      shadowColor: '#764ba2',
    },
    {
      id: 'rank',
      title: 'Class Rank',
      value: `#${mockSelectedChild.rank}`,
      icon: Star,
      gradient: ['#f59e0b', '#d97706', '#b45309'],
      shadowColor: '#d97706',
    },
    {
      id: 'fees',
      title: 'Pending Fees',
      value: `\u20b9${(mockSelectedChild.pendingFees / 1000).toFixed(0)}K`,
      icon: CreditCard,
      gradient: ['#ef4444', '#dc2626', '#b91c1c'],
      shadowColor: '#dc2626',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'message',
      title: 'Message Teacher',
      icon: MessageCircle,
      gradient: ['#3b82f6', '#60a5fa'],
      onPress: pendingScreen,
    },
    {
      id: 'fees',
      title: 'Pay Fees',
      icon: CreditCard,
      gradient: ['#059669', '#34d399'],
      onPress: goToFees,
    },
    {
      id: 'leave',
      title: 'Apply Leave',
      icon: Calendar,
      gradient: ['#f59e0b', '#fbbf24'],
      onPress: goToAcademics,
    },
  ];

  return (
    <Screen scrollable={false} edges={[]} statusBarStyle="light">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
          />
        }
      >
        {/* Header */}
        <GradientHeader
          greeting={`${formatGreeting()},`}
          title={user?.full_name ?? user?.first_name ?? 'Parent'}
          notificationCount={2}
          onNotificationPress={goToNotifications}
          right={
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={goToSettings}
              activeOpacity={0.8}
            >
              {profileImageUrl && !imgError ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.profileImage}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.profileFallback}>
                  <Text style={styles.profileFallbackText}>
                    {(user?.full_name ?? user?.first_name ?? 'P')
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          }
        >
          {/* Child Selector */}
          <TouchableOpacity
            className="mt-4 flex-row items-center rounded-2xl bg-white/20 p-3"
            onPress={() => setShowChildSelector(!showChildSelector)}
          >
            <Avatar name={selectedChild.name} size="md" />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-white">
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
            <View className="mt-2 overflow-hidden rounded-2xl bg-white">
              {mockChildren.map((child, index) => (
                <TouchableOpacity
                  key={child.id}
                  className={`flex-row items-center p-3 ${
                    index !== mockChildren.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  } ${index === selectedChildIndex ? 'bg-primary-50' : ''}`}
                  onPress={() => {
                    setSelectedChildIndex(index);
                    setShowChildSelector(false);
                  }}
                >
                  <Avatar name={child.name} size="sm" />
                  <View className="ml-3 flex-1">
                    <Text className="font-medium text-gray-900">
                      {child.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Class {child.class}
                    </Text>
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
        </GradientHeader>

        {/* Stats Row */}
        <View style={styles.statsWrap}>
          <StatsGrid stats={parentStats} />
        </View>

        {/* Content */}
        <View className="px-4 pt-4">
          {user && (
            <VerificationBanner
              user={user}
              includeGuardianChecks={false}
              onVerifyEmail={() =>
                navigation.navigate('ChangeEmail', {
                  mode: 'verify',
                  from: 'dashboard',
                })
              }
              onVerifyPhone={() =>
                navigation.navigate('ChangePhone', {
                  mode: 'verify',
                  from: 'dashboard',
                })
              }
            />
          )}

          {/* Announcements */}
          {mockAnnouncements.length > 0 && (
            <View className="mb-6">
              <PressableScale
                onPress={() => navigation.navigate('Announcements')}
                style={styles.rounded16}
              >
                <View className="flex-row items-center rounded-2xl border border-primary-200 bg-primary-50 p-4">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Megaphone size={20} color={colors.primary[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-primary-800">
                      {mockAnnouncements[0].title}
                    </Text>
                    <Text
                      className="text-sm text-primary-600"
                      numberOfLines={1}
                    >
                      {mockAnnouncements[0].message}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.primary[400]} />
                </View>
              </PressableScale>
            </View>
          )}

          {/* Recent Marks */}
          <View className="mb-6">
            <SectionHeader
              title="Recent Marks"
              icon={BookOpen}
              actionLabel="View All"
              onAction={goToAcademics}
            />

            <FloatingCard>
              {mockRecentMarks.map((mark, index) => (
                <View
                  key={mark.subject}
                  className={`flex-row items-center py-3 ${
                    index !== mockRecentMarks.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                    <BookOpen size={18} color={colors.primary[600]} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {mark.subject}
                    </Text>
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
            </FloatingCard>
          </View>

          {/* Upcoming Events */}
          <View className="mb-6">
            <SectionHeader
              title="Upcoming Events"
              icon={CalendarClock}
              actionLabel="View Calendar"
              onAction={pendingScreen}
            />

            <FloatingCard>
              {mockUpcomingEvents.map((event, index) => {
                const eventColorStyle = {
                  backgroundColor: getEventConfig(event.type).color,
                };
                return (
                  <View
                    key={event.id}
                    className={`flex-row items-center py-3 ${
                      index !== mockUpcomingEvents.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View className="mr-3 w-12 items-center">
                      <Text className="text-xs text-gray-400">
                        {event.date.split(' ')[0]}
                      </Text>
                      <Text className="text-lg font-bold text-gray-900">
                        {event.date.split(' ')[1]}
                      </Text>
                    </View>
                    <View
                      className="mr-3 h-10 w-1 rounded-full"
                      style={eventColorStyle}
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        {event.title}
                      </Text>
                      <Badge
                        variant={getEventConfig(event.type).variant}
                        size="sm"
                      >
                        {event.type}
                      </Badge>
                    </View>
                  </View>
                );
              })}
            </FloatingCard>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <SectionHeader title="Quick Actions" />
            <QuickActionsGrid actions={quickActions} columns={3} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsWrap: { marginTop: -16 },
  scrollContent: { paddingBottom: 100 },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  profileImage: { width: 42, height: 42, borderRadius: 14 },
  profileFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileFallbackText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rounded16: { borderRadius: 16 },
});
