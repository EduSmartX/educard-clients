/**
 * Student Fees Screen
 * List student fees filtered by class, status, search
 * Supports recording payments per student
 */

import { FeeStatusOptions, FeeStatus } from '@educard/shared';
import type { StudentFee, FeeStatusType, ReminderChannelType } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Users,
  AlertTriangle,
  Bell,
  CreditCard,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { EmptyState, ErrorState, LoadingState, ListFooter } from '@/components/common/ListStates';
import { SearchBar } from '@/components/common/SearchBar';
import { ClassFilterDropdown } from '@/components/filters';
import { FormDropdown } from '@/components/forms/FormDropdown';
import { RecordPaymentModal } from '@/features/fee/components/record-payment-modal';
import { SendReminderModal } from '@/features/fee/components/send-reminder-modal';
import { useAndroidBack } from '@/hooks';

import { FeeStatusBadge } from '../components/fee-status-badge';
import { useStudentFees, useSendFeeReminder } from '../hooks';

const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...FeeStatusOptions];

// ─── Student Fee Card ─────────────────────────────────────────────────────────

interface StudentFeeCardProps {
  item: StudentFee;
  onRecordPayment: (item: StudentFee) => void;
  onSendReminder: (item: StudentFee) => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
}

const StudentFeeCard = React.memo(
  ({ item, onRecordPayment, onSendReminder, onViewDetail, onEdit }: StudentFeeCardProps) => {
    const isRefunding = item.status === FeeStatus.REFUNDING;
    const isRefunded = item.status === FeeStatus.REFUNDED;
    const isOverpaid = item.status === FeeStatus.OVERPAID;
    const isRefundFlow = isRefunding || isRefunded;
    const _showRefundAction = isRefunding || isOverpaid;

    const getFeeColor = (item: { paid_percentage: number; is_overdue?: boolean }) => {
      if (item.paid_percentage >= 100) return '#059669';
      if (item.paid_percentage >= 50) return '#3b82f6';
      if (item.is_overdue) return '#dc2626';
      return '#f59e0b';
    };

    const pctColor = getFeeColor(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onViewDetail(item.public_id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.student_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.student_name}
            </Text>
            <Text style={styles.studentMeta}>
              {item.class_name} · {item.student_roll_number}
            </Text>
          </View>
          <FeeStatusBadge status={item.status} size="sm" />
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(item.paid_percentage, 100)}%`, backgroundColor: pctColor },
              ]}
            />
          </View>
          <Text style={[styles.pctText, { color: pctColor }]}>
            {Math.round(item.paid_percentage)}%
          </Text>
        </View>

        {/* Amounts */}
        <View style={styles.amountsRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>
              ₹{Number(item.final_amount).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountValue, { color: '#059669' }]}>
              ₹{Number(item.amount_paid).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text
              style={[styles.amountValue, { color: item.balance_due > 0 ? '#dc2626' : '#059669' }]}
            >
              ₹{Number(item.balance_due).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {isOverpaid && (
          <View style={styles.overdueTag}>
            <AlertTriangle size={12} color="#dc2626" />
            <Text style={styles.overdueText}>
              Overpaid · Excess ₹
              {(Number(item.amount_paid) - Number(item.final_amount)).toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        {isRefunding && (
          <View style={styles.refundInfoTag}>
            <AlertCircle size={12} color="#c2410c" />
            <Text style={styles.refundInfoText}>Admin refund processing in progress</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          {(isRefunding || isOverpaid) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#fff7ed' }]}
              onPress={() => onRecordPayment(item)}
            >
              <CreditCard size={14} color="#ea580c" />
              <Text style={[styles.actionText, { color: '#ea580c' }]}>Refund</Text>
            </TouchableOpacity>
          )}
          {!(isRefunding || isOverpaid) &&
            !isRefunded &&
            item.status !== FeeStatus.PAID &&
            item.status !== FeeStatus.WAIVED && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#f0fdf4' }]}
                onPress={() => onRecordPayment(item)}
              >
                <CreditCard size={14} color="#059669" />
                <Text style={[styles.actionText, { color: '#059669' }]}>Pay</Text>
              </TouchableOpacity>
            )}

          {!isRefundFlow && !isOverpaid && item.status !== FeeStatus.PAID && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
              onPress={() => onSendReminder(item)}
            >
              <Bell size={14} color="#3b82f6" />
              <Text style={[styles.actionText, { color: '#3b82f6' }]}>Remind</Text>
            </TouchableOpacity>
          )}

          {!isRefundFlow && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#f5f3ff' }]}
              onPress={() => onEdit(item.public_id)}
            >
              <Text style={[styles.actionText, { color: '#7c3aed' }]}>Edit</Text>
            </TouchableOpacity>
          )}

          {isRefunded && (
            <View style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.actionText, { color: '#0284c7' }]}>Refunded</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#f8fafc', marginLeft: 'auto' }]}
            onPress={() => onViewDetail(item.public_id)}
          >
            <Text style={[styles.actionText, { color: '#64748b' }]}>Details</Text>
            <ChevronRight size={14} color="#64748b" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }
);
StudentFeeCard.displayName = 'StudentFeeCard';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StudentFeesScreen() {
  const router = useRouter();
  useAndroidBack('/(tabs)/(admin)/fee-dashboard');
  const params = useLocalSearchParams<{
    fee_structure_public_id?: string;
    class_public_id?: string;
  }>();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState(params.class_public_id ?? '');
  const [paymentTarget, setPaymentTarget] = useState<StudentFee | null>(null);
  const scrollY = useRef(0);

  const filters = {
    status: (statusFilter || undefined) as FeeStatusType | undefined,
    class_public_id: classFilter || undefined,
    fee_structure_public_id: params.fee_structure_public_id || undefined,
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isRefetching,
  } = useStudentFees(filters);

  const { mutate: sendReminder, isPending: reminderPending } = useSendFeeReminder();

  // Reminder modal state
  const [reminderTarget, setReminderTarget] = useState<StudentFee | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const items = data?.items ?? [];
  // Exclude refunded records by default (soft-deleted on backend, safety filter here)
  const activeItems =
    statusFilter === FeeStatus.REFUNDED
      ? items
      : items.filter((s) => s.status !== FeeStatus.REFUNDED);
  const filtered = search
    ? activeItems.filter(
        (s) =>
          s.student_name.toLowerCase().includes(search.toLowerCase()) ||
          s.student_roll_number?.toLowerCase().includes(search.toLowerCase())
      )
    : activeItems;

  const handleEndReached = useCallback(() => {
    if (scrollY.current > 0 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleSendReminder = useCallback((item: StudentFee) => {
    setReminderTarget(item);
    setShowReminderModal(true);
  }, []);

  const handleReminderSend = useCallback(
    (channel: ReminderChannelType) => {
      if (!reminderTarget) return;
      sendReminder(
        { student_fee_public_id: reminderTarget.public_id, channel },
        {
          onSuccess: () => {
            setShowReminderModal(false);
            setReminderTarget(null);
          },
        }
      );
    },
    [reminderTarget, sendReminder]
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push({
        pathname: '/(tabs)/(admin)/fee-student-detail',
        params: { id },
      });
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push({
        pathname: '/(tabs)/(admin)/fee-student-edit',
        params: { id },
      });
    },
    [router]
  );

  if (isLoading) return <LoadingState color="#7c3aed" message="Loading student fees..." />;
  if (isError)
    return <ErrorState message="Failed to load student fees" onRetry={() => void refetch()} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#a78bfa']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-dashboard')}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>Student Fees</Text>
            <Text style={styles.headerSub}>{data?.totalCount ?? 0} records</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-assign-student')}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filters */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.filters}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search student name or roll..."
        />
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <ClassFilterDropdown
              label="Class"
              value={classFilter}
              onChange={setClassFilter}
              includeAllOption
              allOptionLabel="All Classes"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormDropdown
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              searchable
            />
          </View>
        </View>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.public_id}
        renderItem={({ item }) => (
          <StudentFeeCard
            item={item}
            onRecordPayment={setPaymentTarget}
            onSendReminder={handleSendReminder}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
          />
        )}
        contentContainerStyle={styles.list}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => void refetch()}
            tintColor="#7c3aed"
          />
        }
        ListFooterComponent={<ListFooter isLoading={isFetchingNextPage} color="#7c3aed" />}
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={48} color="#cbd5e1" />}
            message="No student fees found"
            subMessage="Try adjusting your filters"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Record Payment Modal */}
      {paymentTarget && (
        <RecordPaymentModal
          studentFee={paymentTarget}
          mode={
            paymentTarget.status === FeeStatus.REFUNDING ||
            paymentTarget.status === FeeStatus.OVERPAID
              ? 'refund'
              : 'payment'
          }
          visible={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
        />
      )}

      {/* Send Reminder Modal */}
      <SendReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderTarget(null);
        }}
        studentFee={reminderTarget}
        onSend={handleReminderSend}
        isLoading={reminderPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: { padding: 12, gap: 8 },
  filterRow: { flexDirection: 'row', gap: 10 },
  list: { paddingHorizontal: 14, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#7c3aed' },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  studentMeta: { fontSize: 12, color: '#64748b', marginTop: 1 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0' },
  progressFill: { height: 6, borderRadius: 3 },
  pctText: { fontSize: 12, fontWeight: '700', minWidth: 36 },
  amountsRow: { flexDirection: 'row', marginBottom: 8 },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  amountValue: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  overdueText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  refundInfoTag: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  refundInfoText: {
    fontSize: 11,
    color: '#c2410c',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});
