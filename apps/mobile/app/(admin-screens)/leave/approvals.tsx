/**
 * Leave Approvals Screen
 * Lists pending leave requests for review with approve/reject actions
 * Filters: status, staff search, date range
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

import { ConfirmDialog } from '@/components/common';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import {
  useLeaveReviews,
  useApproveLeave,
  useRejectLeave,
  type LeaveRequest,
} from '@/features/leave';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const STATUS_FILTERS = [
  { label: 'Pending', value: 'pending', color: '#f59e0b' },
  { label: 'Approved', value: 'approved', color: '#059669' },
  { label: 'Rejected', value: 'rejected', color: '#dc2626' },
  { label: 'All', value: '', color: '#6366f1' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  approved: { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
  rejected: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  cancelled: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

export default function LeaveApprovalsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Approve confirmation
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; item: LeaveRequest | null }>({
    visible: false,
    item: null,
  });
  const [rejectComment, setRejectComment] = useState('');

  const queryParams = useMemo(() => {
    const p: Record<string, any> = {
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

  const reviews = data?.data || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleSearch = () => {
    setSearchQuery(searchText.trim());
  };

  const clearFilters = () => {
    setSearchText('');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
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
        }
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
      }
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item, index }: { item: LeaveRequest; index: number }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
              <User size={20} color="#2563eb" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.user_name}</Text>
              <Text style={styles.cardSubtitle}>{item.leave_name || item.leave_type_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue}>{formatDate(item.start_date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{formatDate(item.end_date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Days</Text>
              <Text style={[styles.detailValue, { color: '#7c3aed', fontWeight: '800' }]}>
                {item.number_of_days}
              </Text>
            </View>
          </View>

          {item.reason ? (
            <Text style={styles.reason} numberOfLines={2}>
              {'\uD83D\uDCAC'} {item.reason}
            </Text>
          ) : null}

          {item.status === 'pending' && (
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
            <TouchableOpacity
              style={headerStyles.backBtn}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Leave Approvals</Text>
              <Text style={headerStyles.subtitle}>{reviews.length} requests</Text>
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

      {/* Expandable Date Filters */}
      {showFilters && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.dateFilters}>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <FormDatePicker label="From Date" value={dateFrom} onChange={setDateFrom} />
            </View>
            <View style={{ flex: 1 }}>
              <FormDatePicker label="To Date" value={dateTo} onChange={setDateTo} />
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
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No leave requests to review</Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                Rejecting {rejectModal.item.user_name}'s {rejectModal.item.leave_type_name} request
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
                style={[styles.modalRejectBtn, rejectMutation.isPending && { opacity: 0.5 }]}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        visible={!!approveTarget}
        title="Approve Leave"
        message={approveTarget ? `Approve ${approveTarget.user_name}'s leave request?` : ''}
        confirmText="Approve"
        onConfirm={confirmApprove}
        onCancel={() => setApproveTarget(null)}
        confirmVariant="success"
        isLoading={approveMutation.isPending}
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
  dateRow: { flexDirection: 'row', gap: 10 },
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
  detailsRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 11, color: Colors.gray[500] },
  detailValue: { fontSize: 13, fontWeight: '600', color: Colors.gray[700], marginTop: 2 },
  reason: {
    fontSize: 13,
    color: Colors.gray[600],
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
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
  rejectBtn: { backgroundColor: '#dc2626' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalRejectText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
