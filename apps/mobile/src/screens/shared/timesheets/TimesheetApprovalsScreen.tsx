/**
 * Timesheet Approvals Screen
 * Lists submitted timesheets for admin/supervisor review
 * Filters: status, staff search, date (week)
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Minus,
  Search,
  Filter,
  X,
  XCircle,
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
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import { ConfirmDialog } from '@/components/common';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { handleMutationError } from '@/lib/mutation-utils';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { useCriticalOperation } from '@/providers/critical-operation-context';
import { headerStyles, layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

import { getDayStatus } from '@/features/attendance/utils/get-day-status';

import { styles } from './timesheet-approvals-styles';
import {
  TimesheetApprovalCard,
  formatWeekDate,
  type TimesheetSubmission,
} from './TimesheetApprovalCard';

const adminGradient = getRoleGradient('admin');

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination?: { count: number };
}

interface AttendanceDayRecord {
  date: string;
  morning_present: boolean | null;
  afternoon_present: boolean | null;
  is_holiday?: boolean;
  holiday_name?: string | null;
  is_leave?: boolean;
  leave_type?: string | null;
  leave_type_name?: string | null;
  leave_status?: string | null;
  is_working_day?: boolean;
}

interface AttendanceDetailResponse {
  records: AttendanceDayRecord[];
  stats?: Record<string, number>;
  holiday_descriptions?: Record<
    string,
    {
      type?: string;
      description?: string;
      name?: string;
    }
  >;
  calendar_exceptions?: Array<{ date: string; type?: string; reason?: string }>;
  working_day_policy?: {
    sunday_off?: boolean;
    saturday_off_pattern?: string;
  } | null;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function SessionIcon({
  isHoliday,
  hasRecord,
  isLeave,
  isPresent,
}: {
  isHoliday: boolean;
  hasRecord: boolean;
  isLeave: boolean;
  isPresent: boolean;
}) {
  if (isHoliday || (!hasRecord && !isLeave)) {
    return <Minus size={16} color="#d1d5db" />;
  }
  if (isPresent) {
    return <CheckCircle2 size={16} color="#16a34a" />;
  }
  return <XCircle size={16} color="#f87171" />;
}

const STATUS_FILTERS = [
  { label: 'Submitted', value: 'SUBMITTED', color: '#f59e0b' },
  { label: 'Approved', value: 'APPROVED', color: '#059669' },
  { label: 'Rejected', value: 'REJECTED', color: '#dc2626' },
  { label: 'All', value: '', color: '#6366f1' },
];

export default function TimesheetApprovalsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [weekDate, setWeekDate] = useState('');
  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    item: TimesheetSubmission | null;
  }>({
    visible: false,
    item: null,
  });

  // Approve confirmation
  const [approveTarget, setApproveTarget] =
    useState<TimesheetSubmission | null>(null);

  // Return comments modal
  const [returnModal, setReturnModal] = useState<{
    visible: boolean;
    item: TimesheetSubmission | null;
  }>({
    visible: false,
    item: null,
  });
  const [returnComment, setReturnComment] = useState('');
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const queryParams = useMemo(() => {
    const p: Record<string, string> = { view_type: 'staff' };
    if (statusFilter) p.submission_status = statusFilter;
    if (searchQuery) p.search = searchQuery;
    if (weekDate) p.week_start_date = weekDate;
    return p;
  }, [statusFilter, searchQuery, weekDate]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['timesheets', 'staff', queryParams],
    queryFn: async () => {
      const res = await apiClient.get<ApiListResponse<TimesheetSubmission>>(
        '/attendance/timesheet-submission/',
        { params: queryParams },
      );
      return res.data;
    },
    staleTime: 30_000,
  });

  const { data: detailAttendance, isLoading: isLoadingDetail } = useQuery({
    queryKey: [
      'timesheets',
      'attendance-detail',
      detailModal.item?.employee_info.public_id,
      detailModal.item?.week_start_date,
      detailModal.item?.week_end_date,
    ],
    enabled: detailModal.visible && !!detailModal.item,
    queryFn: async () => {
      if (!detailModal.item) {
        return { records: [] } as AttendanceDetailResponse;
      }
      const res = await apiClient.get('/attendance/employee-attendance/', {
        params: {
          from_date: detailModal.item.week_start_date,
          to_date: detailModal.item.week_end_date,
          user: detailModal.item.employee_info.public_id,
        },
      });
      const payload = (res.data?.data ||
        res.data ||
        {}) as AttendanceDetailResponse;
      return {
        records: payload.records || [],
        stats: payload.stats || {},
        holiday_descriptions: payload.holiday_descriptions || {},
        calendar_exceptions: payload.calendar_exceptions || [],
        working_day_policy: payload.working_day_policy || null,
      };
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      publicId,
      submissionStatus,
      reviewComments,
    }: {
      publicId: string;
      submissionStatus: string;
      reviewComments?: string;
    }) => {
      const res = await apiClient.post(
        `/attendance/timesheet-submission/${publicId}/review/`,
        {
          submission_status: submissionStatus,
          review_comments: reviewComments ?? '',
        },
      );
      return res.data as { message?: string; data?: unknown };
    },
    onSuccess: response => {
      const message = response?.message || 'Timesheet reviewed successfully';
      showToast('success', message);
      void qc.invalidateQueries({ queryKey: ['timesheets'] });
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to review timesheet');
    },
  });

  const timesheets = useMemo(() => {
    const list = data?.data ?? [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      t =>
        t.employee_info.full_name.toLowerCase().includes(q) ||
        t.employee_info.email.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleSearch = () => {
    setSearchQuery(searchText.trim());
  };

  const clearFilters = () => {
    setSearchText('');
    setSearchQuery('');
    setWeekDate('');
  };

  const hasActiveFilters = !!searchQuery || !!weekDate;

  const handleApprove = (item: TimesheetSubmission) => {
    setApproveTarget(item);
  };

  const handleViewDetails = (item: TimesheetSubmission) => {
    setDetailModal({ visible: true, item });
  };

  const confirmApprove = () => {
    if (approveTarget) {
      beginCriticalOperation({
        title: 'Approving timesheet',
        description: 'Please keep this screen open until the review completes.',
      });
      reviewMutation.mutate(
        {
          publicId: approveTarget.public_id,
          submissionStatus: 'APPROVED',
        },
        {
          onSuccess: () => setApproveTarget(null),
          onError: () => setApproveTarget(null),
          onSettled: () => endCriticalOperation(),
        },
      );
    }
  };

  const handleReturn = (item: TimesheetSubmission) => {
    setReturnComment('');
    setReturnModal({ visible: true, item });
  };

  const submitReturn = () => {
    if (!returnModal.item) return;
    if (!returnComment.trim()) {
      Alert.alert('Comment Required', 'Please provide a reason for rejecting.');
      return;
    }
    beginCriticalOperation({
      title: 'Rejecting timesheet',
      description: 'Please keep this screen open until the review completes.',
    });
    reviewMutation.mutate(
      {
        publicId: returnModal.item.public_id,
        submissionStatus: 'REJECTED',
        reviewComments: returnComment.trim(),
      },
      {
        onSuccess: () => {
          setReturnModal({ visible: false, item: null });
          setReturnComment('');
        },
        onSettled: () => endCriticalOperation(),
      },
    );
  };

  const detailRows = useMemo(() => {
    if (!detailModal.item) return [];

    const start = new Date(`${detailModal.item.week_start_date}T00:00:00`);
    const end = new Date(`${detailModal.item.week_end_date}T00:00:00`);
    const recordsByDate = new Map(
      (detailAttendance?.records || []).map(record => [record.date, record]),
    );
    const holidayDescriptions = detailAttendance?.holiday_descriptions || {};
    const exceptionsByDate = new Map(
      (detailAttendance?.calendar_exceptions || []).map(ex => [ex.date, ex]),
    );
    const policy = detailAttendance?.working_day_policy ?? undefined;

    const rows: Array<{
      dateKey: string;
      day: string;
      dateLabel: string;
      statusText: string;
      textColor: string;
      bgColor: string;
      borderColor?: string;
      rowBg: string;
      remarks: string;
      isHoliday: boolean;
      hasRecord: boolean;
      isLeave: boolean;
      morningPresent: boolean;
      afternoonPresent: boolean;
    }> = [];

    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor = addDays(cursor, 1)
    ) {
      const dateKey = toDateKey(cursor);
      const record = recordsByDate.get(dateKey);
      const holidayInfo = holidayDescriptions[dateKey];
      const exception = exceptionsByDate.get(dateKey);
      const dayStatus = getDayStatus(
        cursor,
        record,
        holidayInfo,
        exception,
        policy,
      );

      rows.push({
        dateKey,
        day: cursor.toLocaleDateString('en-IN', { weekday: 'short' }),
        dateLabel: cursor.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        }),
        statusText: dayStatus.statusText,
        textColor: dayStatus.textColor,
        bgColor: dayStatus.bgColor,
        borderColor: dayStatus.borderColor,
        rowBg: dayStatus.rowBg,
        remarks: dayStatus.remarks,
        isHoliday: dayStatus.isHoliday,
        hasRecord: dayStatus.hasRecord,
        isLeave: dayStatus.isLeave,
        morningPresent: dayStatus.morningPresent,
        afternoonPresent: dayStatus.afternoonPresent,
      });
    }

    return rows;
  }, [detailAttendance, detailModal.item]);

  const detailSummary = useMemo(() => {
    const stats = detailAttendance?.stats || {};
    const item = detailModal.item;
    if (!item) {
      return {
        working: 0,
        present: 0,
        absent: 0,
        leave: 0,
        holidays: 0,
        percentage: 0,
      };
    }

    const rawPercentage =
      stats.attendance_percentage ?? item.attendance_percentage ?? 0;
    const percentage =
      typeof rawPercentage === 'string'
        ? Number.parseFloat(rawPercentage) || 0
        : rawPercentage;

    return {
      working: stats.total_working_days ?? item.total_working_days ?? 0,
      present:
        stats.total_present ??
        stats.present_days ??
        item.total_present_days ??
        item.total_present ??
        0,
      absent:
        stats.total_absent ??
        stats.absent_days ??
        item.total_absent_days ??
        item.total_absent ??
        0,
      leave:
        stats.total_leaves ??
        stats.leave_days ??
        item.total_leave_days ??
        item.total_leaves ??
        0,
      holidays: stats.total_holidays ?? item.total_holidays ?? 0,
      percentage: Math.round(percentage),
    };
  }, [detailAttendance, detailModal.item]);

  const renderItem = ({
    item,
    index,
  }: {
    item: TimesheetSubmission;
    index: number;
  }) => (
    <TimesheetApprovalCard
      item={item}
      index={index}
      isReviewing={reviewMutation.isPending}
      onView={handleViewDetails}
      onApprove={handleApprove}
      onReturn={handleReturn}
    />
  );

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Timesheet Approvals</Text>
              <Text style={headerStyles.subtitle}>
                {timesheets.length} submissions
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Status Filter Chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.chip,
              statusFilter === f.value && { backgroundColor: f.color },
            ]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text
              style={[
                styles.chipText,
                statusFilter === f.value && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search + Filter Toggle */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff name..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setSearchQuery('');
              }}
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            showFilters && styles.filterToggleActive,
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color={showFilters ? '#fff' : '#64748b'} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Expandable Date Filter */}
      {showFilters && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={styles.dateFilters}
        >
          <FormDatePicker
            label="Week Starting"
            value={weekDate}
            onChange={setWeekDate}
          />
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <X size={14} color="#dc2626" />
              <Text style={styles.clearBtnText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={timesheets}
          keyExtractor={item => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClipboardList size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No timesheets to review</Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersBtnText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Return Comment Modal */}
      <Modal
        visible={returnModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setReturnModal({ visible: false, item: null })}
      >
        <KeyboardAwareScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalOverlay}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Timesheet</Text>
              <TouchableOpacity
                onPress={() => setReturnModal({ visible: false, item: null })}
                style={styles.modalClose}
              >
                <X size={20} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>
            {returnModal.item && (
              <Text style={styles.modalSubtitle}>
                Rejecting {returnModal.item.employee_info.full_name}&apos;s
                timesheet
              </Text>
            )}
            <Text style={styles.modalLabel}>Comments *</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Enter reason for rejection..."
              placeholderTextColor={Colors.gray[400]}
              value={returnComment}
              onChangeText={setReturnComment}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReturnModal({ visible: false, item: null })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalReturnBtn,
                  reviewMutation.isPending && styles.disabledBtn,
                ]}
                onPress={submitReturn}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <X size={16} color="#fff" />
                    <Text style={styles.modalReturnText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </Modal>

      {/* Timesheet Detail Modal */}
      <Modal
        visible={detailModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModal({ visible: false, item: null })}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleWrap}>
                <Text style={styles.detailTitle}>Timesheet Details</Text>
                {detailModal.item ? (
                  <Text style={styles.detailSubtitle}>
                    {detailModal.item.employee_info.full_name} ·{' '}
                    {formatWeekDate(detailModal.item.week_start_date)} -{' '}
                    {formatWeekDate(detailModal.item.week_end_date)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => setDetailModal({ visible: false, item: null })}
                style={styles.modalClose}
              >
                <X size={20} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailStatsRow}>
              <View style={[styles.detailStatBox, styles.detailStatBlue]}>
                <Text
                  style={[styles.detailStatValue, styles.detailStatValueBlue]}
                >
                  {detailSummary.working}
                </Text>
                <Text style={styles.detailStatLabel}>Working</Text>
              </View>
              <View style={[styles.detailStatBox, styles.detailStatGreen]}>
                <Text
                  style={[styles.detailStatValue, styles.detailStatValueGreen]}
                >
                  {detailSummary.present}
                </Text>
                <Text style={styles.detailStatLabel}>Present</Text>
              </View>
              <View style={[styles.detailStatBox, styles.detailStatRed]}>
                <Text
                  style={[styles.detailStatValue, styles.detailStatValueRed]}
                >
                  {detailSummary.absent}
                </Text>
                <Text style={styles.detailStatLabel}>Absent</Text>
              </View>
              <View style={[styles.detailStatBox, styles.detailStatYellow]}>
                <Text
                  style={[styles.detailStatValue, styles.detailStatValueYellow]}
                >
                  {detailSummary.leave}
                </Text>
                <Text style={styles.detailStatLabel}>Leave</Text>
              </View>
              <View style={[styles.detailStatBox, styles.detailStatPurple]}>
                <Text
                  style={[styles.detailStatValue, styles.detailStatValuePurple]}
                >
                  {detailSummary.holidays}
                </Text>
                <Text style={styles.detailStatLabel}>Holidays</Text>
              </View>
              <View style={[styles.detailStatBox, styles.detailStatIndigo]}>
                <Text
                  style={[styles.detailStatValue, styles.detailStatValueIndigo]}
                >
                  {detailSummary.percentage}%
                </Text>
                <Text style={styles.detailStatLabel}>Att. %</Text>
              </View>
            </View>

            <View style={styles.dayHeaderRow}>
              <Text style={[styles.dayHeaderText, styles.dayDateCol]}>
                Date
              </Text>
              <Text style={[styles.dayHeaderText, styles.dayHeaderStatus]}>
                Status
              </Text>
              <Text style={[styles.dayHeaderText, styles.daySessionsCol]}>
                AM · PM
              </Text>
              <Text style={[styles.dayHeaderText, styles.dayHeaderRemarks]}>
                Remarks
              </Text>
            </View>

            <ScrollView
              style={styles.detailBody}
              contentContainerStyle={styles.detailBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingDetail ? (
                <View style={styles.detailLoadingWrap}>
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                </View>
              ) : (
                detailRows.map(row => {
                  const rowBackground =
                    row.rowBg === 'transparent' ? '#fff' : row.rowBg;
                  return (
                    <View
                      key={row.dateKey}
                      style={[
                        styles.dayRow,
                        { backgroundColor: rowBackground },
                      ]}
                    >
                      <View style={styles.dayDateCol}>
                        <Text style={styles.dayDateText}>{row.dateLabel}</Text>
                        <Text style={styles.dayNameText}>{row.day}</Text>
                      </View>

                      <View
                        style={[
                          styles.dayStatusBadge,
                          {
                            backgroundColor: row.bgColor,
                            borderColor: row.borderColor ?? 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayStatusText,
                            { color: row.textColor },
                          ]}
                          numberOfLines={1}
                        >
                          {row.statusText}
                        </Text>
                      </View>

                      <View style={styles.daySessionsCol}>
                        <SessionIcon
                          isHoliday={row.isHoliday}
                          hasRecord={row.hasRecord}
                          isLeave={row.isLeave}
                          isPresent={row.morningPresent}
                        />
                        <SessionIcon
                          isHoliday={row.isHoliday}
                          hasRecord={row.hasRecord}
                          isLeave={row.isLeave}
                          isPresent={row.afternoonPresent}
                        />
                      </View>

                      <Text style={styles.dayRemarks} numberOfLines={1}>
                        {row.remarks}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setDetailModal({ visible: false, item: null })}
              >
                <Text style={styles.detailCloseBtnText}>Close</Text>
              </TouchableOpacity>

              {detailModal.item?.submission_status === 'SUBMITTED' && (
                <TouchableOpacity
                  style={styles.detailRejectBtn}
                  onPress={() => {
                    if (detailModal.item) {
                      setDetailModal({ visible: false, item: null });
                      handleReturn(detailModal.item);
                    }
                  }}
                >
                  <Text style={styles.detailRejectBtnText}>Reject</Text>
                </TouchableOpacity>
              )}

              {detailModal.item?.submission_status === 'SUBMITTED' && (
                <TouchableOpacity
                  style={styles.detailApproveBtn}
                  onPress={() => {
                    if (detailModal.item) {
                      setDetailModal({ visible: false, item: null });
                      handleApprove(detailModal.item);
                    }
                  }}
                >
                  <Text style={styles.detailApproveBtnText}>Approve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        visible={!!approveTarget}
        title="Approve Timesheet"
        message={
          approveTarget
            ? `Approve ${approveTarget.employee_info.full_name}'s timesheet for ${formatWeekDate(approveTarget.week_start_date)} - ${formatWeekDate(approveTarget.week_end_date)}?`
            : ''
        }
        confirmText="Approve"
        onConfirm={confirmApprove}
        onCancel={() => setApproveTarget(null)}
        confirmVariant="success"
        isLoading={reviewMutation.isPending}
      />
    </View>
  );
}
