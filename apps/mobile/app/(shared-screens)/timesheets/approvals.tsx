/**
 * Timesheet Approvals Screen
 * Lists submitted timesheets for admin/supervisor review
 * Filters: status, staff search, date (week)
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle,
  User,
  ClipboardList,
  Search,
  Filter,
  X,
} from 'lucide-react-native'; // Removed unused: RotateCcw, Clock
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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import { ConfirmDialog } from '@/components/common';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

interface TimesheetSubmission {
  public_id: string;
  employee_info: {
    public_id: string;
    full_name: string;
    email: string;
    role: string;
  };
  week_start_date: string;
  week_end_date: string;
  submission_status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
  review_comments: string;
  total_working_days: number;
  total_present: number;
  total_absent: number;
  total_holidays: number;
  total_leaves: number;
}

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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  SUBMITTED: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  APPROVED: { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  DRAFT: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

export default function TimesheetApprovalsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [weekDate, setWeekDate] = useState('');

  // Approve confirmation
  const [approveTarget, setApproveTarget] = useState<TimesheetSubmission | null>(null);

  // Return comments modal
  const [returnModal, setReturnModal] = useState<{
    visible: boolean;
    item: TimesheetSubmission | null;
  }>({
    visible: false,
    item: null,
  });
  const [returnComment, setReturnComment] = useState('');

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
        { params: queryParams }
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
      const res = await apiClient.post(`/attendance/timesheet-submission/${publicId}/review/`, {
        submission_status: submissionStatus,
        review_comments: reviewComments ?? '', // ?? instead of ||
      });
      return res.data as unknown; // type assertion to fix unsafe return
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timesheets'] }); // void for floating promise
    },
  });

  const timesheets = useMemo(() => {
    const list = data?.data ?? []; // ?? instead of ||
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.employee_info.full_name.toLowerCase().includes(q) ||
        t.employee_info.email.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false)); // void for floating promise
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
      reviewMutation.mutate(
        {
          publicId: approveTarget.public_id,
          submissionStatus: 'APPROVED',
        },
        {
          onSuccess: () => setApproveTarget(null),
          onError: () => setApproveTarget(null),
        }
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
      }
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item, index }: { item: TimesheetSubmission; index: number }) => {
    const statusColor = STATUS_COLORS[item.submission_status] || STATUS_COLORS.DRAFT;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
              <User size={20} color="#2563eb" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.employee_info.full_name}</Text>
              <Text style={styles.cardSubtitle}>
                Week: {formatDate(item.week_start_date)} — {formatDate(item.week_end_date)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.submission_status}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.total_working_days}</Text>
              <Text style={styles.statLabel}>Working</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#059669' }]}>{item.total_present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>{item.total_absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>{item.total_leaves}</Text>
              <Text style={styles.statLabel}>Leave</Text>
            </View>
          </View>

          {item.submission_status === 'SUBMITTED' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprove(item)}
                disabled={reviewMutation.isPending}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.returnBtn]}
                onPress={() => handleReturn(item)}
                disabled={reviewMutation.isPending}
              >
                <X size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.submission_status !== 'SUBMITTED' &&
            item.submission_status !== 'DRAFT' &&
            item.reviewed_by_name && (
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerLabel}>
                  {item.submission_status === 'APPROVED' ? '✓ Approved by: ' : '✗ Rejected by: '}
                </Text>
                <Text style={styles.reviewerName}>{item.reviewed_by_name}</Text>
                {item.reviewed_at && (
                  <Text style={styles.reviewerDate}>
                    {' '}
                    on {formatDate(item.reviewed_at.split('T')[0])}
                  </Text>
                )}
              </View>
            )}

          {item.review_comments ? (
            <Text style={styles.reviewComments} numberOfLines={2}>
              💬 {item.review_comments}
            </Text>
          ) : null}
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Timesheet Approvals</Text>
              <Text style={headerStyles.subtitle}>{timesheets.length} submissions</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Status Filter Chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, statusFilter === f.value && { backgroundColor: f.color }]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text style={[styles.chipText, statusFilter === f.value && styles.chipTextActive]}>
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
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color={showFilters ? '#fff' : '#64748b'} />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Expandable Date Filter */}
      {showFilters && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.dateFilters}>
          <FormDatePicker label="Week Starting" value={weekDate} onChange={setWeekDate} />
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
          keyExtractor={(item) => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClipboardList size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No timesheets to review</Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                Rejecting {returnModal.item.employee_info.full_name}'s timesheet
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
                style={[styles.modalReturnBtn, reviewMutation.isPending && { opacity: 0.5 }]}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        visible={!!approveTarget}
        title="Approve Timesheet"
        message={
          approveTarget
            ? `Approve ${approveTarget.employee_info.full_name}'s timesheet for ${formatDate(approveTarget.week_start_date)} - ${formatDate(approveTarget.week_end_date)}?`
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

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e2e8f0' },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.gray[600] },
  chipTextActive: { color: '#fff' },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', padding: 0 },
  filterToggle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleActive: { backgroundColor: '#6366f1' },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  dateFilters: { paddingHorizontal: 16, paddingBottom: 8 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingVertical: 4,
  },
  clearBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray[800] },
  cardSubtitle: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.gray[800] },
  statLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveBtn: { backgroundColor: '#059669' },
  returnBtn: { backgroundColor: '#f59e0b' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  reviewerInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  reviewerLabel: {
    fontSize: 12,
    color: Colors.gray[600],
    fontWeight: '500',
  },
  reviewerName: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '700',
  },
  reviewerDate: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  reviewComments: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
  },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: Colors.gray[400], marginTop: 12 },
  clearFiltersBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ede9fe',
  },
  clearFiltersBtnText: { fontSize: 13, fontWeight: '600', color: '#7c3aed' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray[800] },
  modalClose: { padding: 4 },
  modalSubtitle: { fontSize: 13, color: Colors.gray[500], marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.gray[800],
    minHeight: 100,
    backgroundColor: '#f8fafc',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.gray[600] },
  modalReturnBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalReturnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
