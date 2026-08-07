/**
 * Leave Approvals Screen
 * Lists pending leave requests for review with approve/reject actions
 * Filters: status, staff search, date range
 */

import { Colors, getRoleGradient, LEAVE_STATUS } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  X,
  Search,
  Filter,
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

import { AttachmentViewer } from '@/components/attachments';
import { ConfirmDialog } from '@/components/common';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import {
  useLeaveReviews,
  useApproveLeave,
  useRejectLeave,
  type LeaveRequest,
} from '@/features/leave';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './leave-approvals-styles';

const adminGradient = getRoleGradient('admin');

const STATUS_FILTERS = [
  { label: 'Pending', value: 'pending', color: '#f59e0b' },
  { label: 'Approved', value: 'approved', color: '#059669' },
  { label: 'Rejected', value: 'rejected', color: '#dc2626' },
  { label: 'All', value: '', color: '#6366f1' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    pending: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
    approved: { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
    rejected: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
    cancelled: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
  };

export default function LeaveApprovalsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const [refreshing, setRefreshing] = useState(false);

  // Filter/search state — persisted across back-navigation via Zustand
  const {
    filters,
    search: searchQuery,
    setFilter,
    setSearch,
  } = useScreenFilters('LeaveApprovals', {
    status: 'pending',
    dateFrom: '',
    dateTo: '',
  });

  const statusFilter = filters.status;
  const dateFrom = filters.dateFrom;
  const dateTo = filters.dateTo;

  const [searchText, setSearchText] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Approve confirmation
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{
    visible: boolean;
    item: LeaveRequest | null;
  }>({
    visible: false,
    item: null,
  });
  const [rejectComment, setRejectComment] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = {
      page_size: 50,
      ordering: '-applied_at',
    };
    if (statusFilter) p.status = statusFilter;
    if (searchQuery) p.search = searchQuery;
    if (dateFrom) p.start_date__gte = dateFrom;
    if (dateTo) p.start_date__lte = dateTo;
    return p;
  }, [statusFilter, searchQuery, dateFrom, dateTo]);

  const { data, isLoading, refetch } = useLeaveReviews(queryParams);
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const reviews = data?.data ?? [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const setDateFrom = useCallback(
    (value: string) => {
      setFilter('dateFrom', value);
    },
    [setFilter],
  );

  const setDateTo = useCallback(
    (value: string) => {
      setFilter('dateTo', value);
    },
    [setFilter],
  );

  const handleSearch = () => {
    setSearch(searchText.trim());
  };

  const clearFilters = () => {
    setSearchText('');
    setSearch('');
    setFilter('dateFrom', '');
    setFilter('dateTo', '');
  };

  const hasActiveFilters = !!searchQuery || !!dateFrom || !!dateTo;

  const handleApprove = (item: LeaveRequest) => {
    setApproveTarget(item);
  };

  const confirmApprove = () => {
    if (approveTarget) {
      approveMutation.mutate(
        { publicId: approveTarget.public_id },
        {
          onSuccess: () => setApproveTarget(null),
          onError: () => setApproveTarget(null),
        },
      );
    }
  };

  const handleReject = (item: LeaveRequest) => {
    setRejectComment('');
    setRejectModal({ visible: true, item });
  };

  const submitReject = () => {
    if (!rejectModal.item) return;
    if (!rejectComment.trim()) {
      Alert.alert('Comment Required', 'Please provide a reason for rejection.');
      return;
    }
    rejectMutation.mutate(
      {
        publicId: rejectModal.item.public_id,
        data: { review_comments: rejectComment.trim() },
      },
      {
        onSuccess: () => {
          setRejectModal({ visible: false, item: null });
          setRejectComment('');
        },
      },
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: LeaveRequest;
    index: number;
  }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <User size={20} color="#2563eb" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.user_name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.leave_name || item.leave_type_name}
              </Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor.dot }]}
              />
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.start_date)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>
                {formatDate(item.end_date)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Days</Text>
              <Text style={[styles.detailValue, styles.detailValueDays]}>
                {item.number_of_days}
              </Text>
            </View>
          </View>

          {item.reason ? (
            <Text style={styles.reason} numberOfLines={2}>
              {'\uD83D\uDCAC'} {item.reason}
            </Text>
          ) : null}

          {item.attachment_url ? (
            <View style={styles.attachmentWrap}>
              <AttachmentViewer
                url={item.attachment_url}
                fileName={item.attachment_name}
              />
            </View>
          ) : null}

          {item.status !== 'pending' && item.reviewed_by_name && (
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerLabel}>
                {item.status === LEAVE_STATUS.APPROVED
                  ? '✓ Approved by: '
                  : '✗ Rejected by: '}
              </Text>
              <Text style={styles.reviewerName}>{item.reviewed_by_name}</Text>
              {!!item.reviewed_at && (
                <Text style={styles.reviewerDate}>
                  {' '}
                  on {formatDate(item.reviewed_at.split('T')[0])}
                </Text>
              )}
            </View>
          )}

          {item.review_comments ? (
            <Text style={styles.reviewComments} numberOfLines={2}>
              {'\uD83D\uDCDD'} {item.review_comments}
            </Text>
          ) : null}

          {item.status === LEAVE_STATUS.PENDING && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprove(item)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleReject(item)}
                disabled={rejectMutation.isPending}
              >
                <XCircle size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

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
              <Text style={headerStyles.title}>Leave Approvals</Text>
              <Text style={headerStyles.subtitle}>
                {reviews.length} requests
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
            onPress={() => setFilter('status', f.value)}
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
                setSearch('');
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

      {/* Expandable Date Filters */}
      {showFilters && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={styles.dateFilters}
        >
          <View style={styles.dateRow}>
            <View style={styles.flex1}>
              <FormDatePicker
                label="From Date"
                value={dateFrom}
                onChange={setDateFrom}
              />
            </View>
            <View style={styles.flex1}>
              <FormDatePicker
                label="To Date"
                value={dateTo}
                onChange={setDateTo}
              />
            </View>
          </View>
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
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={item => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No leave requests to review</Text>
              <Text style={styles.emptySubtext}>
                {hasActiveFilters
                  ? 'No results match current filters.'
                  : 'New requests will appear here when submitted.'}
              </Text>
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

      {/* Reject Comment Modal */}
      <Modal
        visible={rejectModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModal({ visible: false, item: null })}
      >
        <KeyboardAwareScrollView
          style={styles.modalOverlay}
          contentContainerStyle={styles.modalOverlayContent}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Leave</Text>
              <TouchableOpacity
                onPress={() => setRejectModal({ visible: false, item: null })}
                style={styles.modalClose}
              >
                <X size={20} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>
            {rejectModal.item && (
              <Text style={styles.modalSubtitle}>
                Rejecting {rejectModal.item.user_name}&apos;s{' '}
                {rejectModal.item.leave_type_name} request
              </Text>
            )}
            <Text style={styles.modalLabel}>Reason for rejection *</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Enter reason for rejection..."
              placeholderTextColor={Colors.gray[400]}
              value={rejectComment}
              onChangeText={setRejectComment}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModal({ visible: false, item: null })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalRejectBtn,
                  rejectMutation.isPending && styles.disabledBtn,
                ]}
                onPress={submitReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <XCircle size={16} color="#fff" />
                    <Text style={styles.modalRejectText}>Reject</Text>
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
        title="Approve Leave"
        message={
          approveTarget
            ? `Approve ${approveTarget.user_name}'s leave request?`
            : ''
        }
        confirmText="Approve"
        onConfirm={confirmApprove}
        onCancel={() => setApproveTarget(null)}
        confirmVariant="success"
        isLoading={approveMutation.isPending}
      />
    </View>
  );
}
