/**
 * My Leave Requests Screen - View and cancel leave requests
 */

import {
  getRoleGradient,
  getRoleThemeColors,
  LEAVE_STATUS,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import {
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
  X,
  CalendarCheck,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FAB as FloatingActionButton } from '@/components/common';
import { useHolidays } from '@/features/holidays';
import { useMyLeaveRequests, useCancelLeaveRequest } from '@/features/leave';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './my-leave-requests-styles';

const employeeTheme = getRoleThemeColors('employee');
const employeeGradient = getRoleGradient('employee');

interface LeaveRequest {
  public_id: string;
  leave_type_name: string;
  leave_name: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  can_be_cancelled: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    label: 'Pending',
  },
  approved: {
    icon: CheckCircle,
    color: '#10b981',
    bgColor: '#d1fae5',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: '#ef4444',
    bgColor: '#fee2e2',
    label: 'Rejected',
  },
  cancelled: {
    icon: X,
    color: '#6b7280',
    bgColor: '#f3f4f6',
    label: 'Cancelled',
  },
};

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function MyLeaveRequestsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { filters, setFilter } = useScreenFilters<{ status: FilterStatus }>(
    'MyLeaveRequests',
    {
      status: 'all',
    },
  );
  const filter = filters.status;
  const [refreshing, setRefreshing] = useState(false);

  const { data: requestsData, isLoading, refetch } = useMyLeaveRequests();
  const { data: holidaysData } = useHolidays();
  const cancelMutation = useCancelLeaveRequest();

  const goToApply = useCallback(
    () => navigation.navigate('LeaveApply'),
    [navigation],
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Filter upcoming holidays (only future dates)
  const upcomingHolidays = useMemo(() => {
    const today = startOfToday();
    const holidays = holidaysData?.data ?? [];
    return holidays
      .filter(h => {
        const holidayDate = h.start_date;
        if (!holidayDate) return false;
        return (
          isAfter(parseISO(holidayDate), today) ||
          format(parseISO(holidayDate), 'yyyy-MM-dd') ===
            format(today, 'yyyy-MM-dd')
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      )
      .slice(0, 5); // Show only next 5 holidays
  }, [holidaysData]);

  const requests = useMemo(() => {
    const data = requestsData?.data ?? [];
    if (filter === 'all') return data;
    return data.filter(r => r.status === filter);
  }, [requestsData, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleCancel = useCallback(
    (request: LeaveRequest) => {
      Alert.alert(
        'Cancel Leave Request',
        `Are you sure you want to cancel your ${request.leave_type_name || request.leave_name} request for ${format(parseISO(request.start_date), 'dd MMM yyyy')}?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: () => cancelMutation.mutate(request.public_id),
          },
        ],
      );
    },
    [cancelMutation],
  );

  const renderFilterChip = (status: FilterStatus, label: string) => {
    const isActive = filter === status;
    return (
      <TouchableOpacity
        key={status}
        style={[
          styles.filterChip,
          isActive && { backgroundColor: employeeTheme.accent },
        ]}
        onPress={() => setFilter('status', status)}
      >
        <Text
          style={[
            styles.filterChipText,
            isActive && styles.filterChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: LeaveRequest;
    index: number;
  }) => {
    const config = statusConfig[item.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(300)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.leaveTypeContainer}>
            <CalendarDays size={20} color={employeeTheme.accent} />
            <Text style={styles.leaveTypeName}>
              {item.leave_type_name || item.leave_name || 'Leave'}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: config.bgColor }]}
          >
            <StatusIcon size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.dateRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.dateText}>
              {format(parseISO(item.start_date), 'dd MMM yyyy')}
              {item.start_date !== item.end_date && (
                <Text> - {format(parseISO(item.end_date), 'dd MMM yyyy')}</Text>
              )}
            </Text>
            <View style={styles.daysContainer}>
              <Text style={styles.daysText}>
                {item.number_of_days} day{item.number_of_days !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {!!item.reason && (
            <Text style={styles.reason} numberOfLines={2}>
              {item.reason}
            </Text>
          )}

          {item.status !== 'pending' &&
            item.status !== 'cancelled' &&
            !!item.reviewed_by_name && (
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerInfoLabel}>
                  {item.status === LEAVE_STATUS.APPROVED
                    ? '✓ Approved by: '
                    : '✗ Rejected by: '}
                </Text>
                <Text style={styles.reviewerInfoName}>
                  {item.reviewed_by_name}
                </Text>
                {!!item.reviewed_at && (
                  <Text style={styles.reviewerInfoDate}>
                    {' on '}
                    {format(parseISO(item.reviewed_at), 'dd MMM yyyy')}
                  </Text>
                )}
              </View>
            )}

          {!!item.review_comments && (
            <View style={styles.reviewComments}>
              <Text style={styles.reviewLabel}>Review: </Text>
              <Text style={styles.reviewText}>{item.review_comments}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.appliedDate}>
              Applied: {format(parseISO(item.applied_at), 'dd MMM yyyy')}
            </Text>
            {item.can_be_cancelled && item.status === LEAVE_STATUS.PENDING && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item)}
              >
                <X size={14} color="#ef4444" />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <CalendarDays size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Leave Requests</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? "You haven't applied for any leave yet"
          : `No ${filter} leave requests found`}
      </Text>
      <TouchableOpacity
        style={[styles.applyButton, { backgroundColor: employeeTheme.accent }]}
        onPress={goToApply}
      >
        <Plus size={18} color="#fff" />
        <Text style={styles.applyButtonText}>Apply for Leave</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={employeeGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={headerStyles.content}
        >
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>My Leave Requests</Text>
              <Text style={headerStyles.subtitle}>
                View and manage your leaves
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {renderFilterChip('all', 'All')}
        {renderFilterChip('pending', 'Pending')}
        {renderFilterChip('approved', 'Approved')}
        {renderFilterChip('rejected', 'Rejected')}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={employeeTheme.accent} />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            upcomingHolidays.length > 0 ? (
              <Animated.View
                entering={FadeInDown.delay(100).duration(300)}
                style={styles.holidaysSection}
              >
                <View style={styles.holidaysSectionHeader}>
                  <CalendarCheck size={18} color="#dc2626" />
                  <Text style={styles.holidaysSectionTitle}>
                    Upcoming Holidays
                  </Text>
                </View>
                {upcomingHolidays.map((holiday, index) => (
                  <View
                    key={holiday.public_id ?? index}
                    style={styles.holidayItem}
                  >
                    <View style={styles.holidayDate}>
                      <Text style={styles.holidayDay}>
                        {format(parseISO(holiday.start_date), 'dd')}
                      </Text>
                      <Text style={styles.holidayMonth}>
                        {format(parseISO(holiday.start_date), 'MMM')}
                      </Text>
                    </View>
                    <View style={styles.holidayInfo}>
                      <Text style={styles.holidayName}>
                        {holiday.description}
                      </Text>
                      <Text style={styles.holidayDayName}>
                        {format(parseISO(holiday.start_date), 'EEEE')}
                      </Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[employeeTheme.accent]}
              tintColor={employeeTheme.accent}
            />
          }
        />
      )}

      {/* FAB for Apply Leave */}
      <FloatingActionButton
        icon={Plus}
        onPress={goToApply}
        style={{ backgroundColor: employeeTheme.accent }}
      />
    </View>
  );
}
