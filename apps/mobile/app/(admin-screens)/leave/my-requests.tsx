/**
 * My Leave Requests Screen - View and cancel leave requests
 */

import { Colors, getRoleGradient, getRoleThemeColors, extractApiError } from '@educard/shared';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  MoreVertical,
  X,
  CalendarCheck,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SectionList,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FAB } from '@/components/common';
import { useHolidays } from '@/features/holidays';
import { useMyLeaveRequests, useCancelLeaveRequest } from '@/features/leave';
import { headerStyles, layoutStyles } from '@/styles';

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
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: requestsData, isLoading, refetch } = useMyLeaveRequests();
  const { data: holidaysData } = useHolidays();
  const cancelMutation = useCancelLeaveRequest();

  // Filter upcoming holidays (only future dates)
  const upcomingHolidays = useMemo(() => {
    const today = startOfToday();
    const holidays = holidaysData?.data ?? [];
    return holidays
      .filter((h) => isAfter(parseISO(h.date), today) || format(parseISO(h.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5); // Show only next 5 holidays
  }, [holidaysData]);

  const requests = useMemo(() => {
    const data = requestsData?.data ?? [];
    if (filter === 'all') return data;
    return data.filter((r) => r.status === filter);
  }, [requestsData, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
        ]
      );
    },
    [cancelMutation]
  );

  const renderFilterChip = (status: FilterStatus, label: string) => {
    const isActive = filter === status;
    return (
      <TouchableOpacity
        key={status}
        style={[styles.filterChip, isActive && { backgroundColor: employeeTheme.accent }]}
        onPress={() => setFilter(status)}
      >
        <Text style={[styles.filterChipText, isActive && { color: '#fff' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }: { item: LeaveRequest; index: number }) => {
    const config = statusConfig[item.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.leaveTypeContainer}>
            <CalendarDays size={20} color={employeeTheme.accent} />
            <Text style={styles.leaveTypeName}>
              {item.leave_type_name || item.leave_name || 'Leave'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <StatusIcon size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
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

          {item.reason && (
            <Text style={styles.reason} numberOfLines={2}>
              {item.reason}
            </Text>
          )}

          {item.review_comments && (
            <View style={styles.reviewComments}>
              <Text style={styles.reviewLabel}>Review: </Text>
              <Text style={styles.reviewText}>{item.review_comments}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.appliedDate}>
              Applied: {format(parseISO(item.applied_at), 'dd MMM yyyy')}
            </Text>
            {item.can_be_cancelled && item.status === 'pending' && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item)}>
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
        onPress={() => router.push('/(admin-screens)/leave/apply')}
      >
        <Plus size={18} color="#fff" />
        <Text style={styles.applyButtonText}>Apply for Leave</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={employeeGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.duration(300)} style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>My Leave Requests</Text>
              <Text style={headerStyles.subtitle}>View and manage your leaves</Text>
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
          keyExtractor={(item) => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            upcomingHolidays.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.holidaysSection}>
                <View style={styles.holidaysSectionHeader}>
                  <CalendarCheck size={18} color="#dc2626" />
                  <Text style={styles.holidaysSectionTitle}>Upcoming Holidays</Text>
                </View>
                {upcomingHolidays.map((holiday, index) => (
                  <View key={holiday.public_id ?? index} style={styles.holidayItem}>
                    <View style={styles.holidayDate}>
                      <Text style={styles.holidayDay}>{format(parseISO(holiday.date), 'dd')}</Text>
                      <Text style={styles.holidayMonth}>{format(parseISO(holiday.date), 'MMM')}</Text>
                    </View>
                    <View style={styles.holidayInfo}>
                      <Text style={styles.holidayName}>{holiday.name}</Text>
                      <Text style={styles.holidayDayName}>{format(parseISO(holiday.date), 'EEEE')}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
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
      <FAB
        icon={Plus}
        onPress={() => router.push('/(admin-screens)/leave/apply')}
        style={{ backgroundColor: employeeTheme.accent }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  daysContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  reason: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewComments: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  reviewText: {
    fontSize: 13,
    color: '#92400e',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  appliedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ef4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Upcoming Holidays Section
  holidaysSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  holidaysSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  holidaysSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  holidayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  holidayDate: {
    width: 50,
    height: 50,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  holidayDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  holidayMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'uppercase',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  holidayDayName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
