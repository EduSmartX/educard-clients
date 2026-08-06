/**
 * Timesheet Approvals Screen
 * Lists submitted timesheets for admin/supervisor review
 * Filters: status, staff search, date (week)
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ClipboardList,
  Search,
  Filter,
  X,
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
