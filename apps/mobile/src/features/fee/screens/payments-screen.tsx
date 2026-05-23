/**
 * Payments Screen
 * All payments with filters + analytics summary
 */

import type { FeePayment, PaymentModeType, TransactionTypeValue } from '@educard/shared';
import { TransactionType } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  TrendingUp,
  CreditCard,
  IndianRupee,
  TrendingDown,
  Percent,
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
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';

import { EmptyState, ErrorState, LoadingState, ListFooter } from '@/components/common/ListStates';
import { SearchBar } from '@/components/common/SearchBar';
import {
  FilterModal,
  ActiveFilters,
  PAYMENT_FILTER_FIELDS,
  getPaymentFilterLabels,
  type PaymentFiltersState,
} from '@/components/filters';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { useAndroidBack } from '@/hooks';

import { PaymentModeBadge } from '../components/payment-mode-badge';
import { usePayments, useFeeDashboard } from '../hooks';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradientColors: [string, string];
  delay?: number;
}

function StatCard({ label, value, icon, gradientColors, delay = 0 }: StatCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={styles.statCardWrapper}>
      <LinearGradient colors={gradientColors} style={styles.statCard}>
        <View style={styles.statIconBox}>{icon}</View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Payment Card ─────────────────────────────────────────────────────────────

interface PaymentCardProps {
  item: FeePayment;
  index: number;
}

const PaymentCard = React.memo(({ item, index }: PaymentCardProps) => {
  const isRefund = item.transaction_type === TransactionType.DEBIT;
  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index, 10) * 40).duration(300)}>
      <View style={[styles.card, isRefund && styles.cardRefund]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: isRefund ? '#fef2f2' : '#f0fdf4' }]}>
            {isRefund ? (
              <TrendingDown size={18} color="#dc2626" />
            ) : (
              <IndianRupee size={18} color="#059669" />
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.student_name}
            </Text>
            <Text style={styles.receiptNo}>#{item.receipt_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amount, { color: isRefund ? '#dc2626' : '#059669' }]}>
              {isRefund ? '-' : '+'}₹{Number(item.amount).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.date}>{item.payment_date}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <PaymentModeBadge mode={item.payment_mode} size="sm" />
          {item.utr_number ? <Text style={styles.utr}>UTR: {item.utr_number}</Text> : null}
          <Text style={styles.receivedBy}>by {item.received_by_name}</Text>
        </View>
      </View>
    </Animated.View>
  );
});
PaymentCard.displayName = 'PaymentCard';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentsScreen() {
  const router = useRouter();
  useAndroidBack('/(tabs)/(admin)/fee-dashboard');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<PaymentFiltersState>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDatePickers, setShowDatePickers] = useState(false);
  const scrollY = useRef(0);

  const { data: dashboard } = useFeeDashboard();

  const queryFilters = {
    search: appliedSearch || undefined,
    payment_mode: (filters.payment_mode || undefined) as PaymentModeType | undefined,
    transaction_type: (filters.transaction_type || undefined) as TransactionTypeValue | undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
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
  } = usePayments(queryFilters);

  const items = data?.items ?? [];

  const handleEndReached = useCallback(() => {
    if (scrollY.current > 0 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleApplyFilters = useCallback((newFilters: PaymentFiltersState) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setDateFrom('');
    setDateTo('');
    setShowFilterModal(false);
  }, []);

  // Build active filter labels — include date chips too
  const activeFilterLabels = [
    ...getPaymentFilterLabels(filters),
    ...(dateFrom ? [{ key: 'date_from', label: `From: ${dateFrom}`, value: dateFrom }] : []),
    ...(dateTo ? [{ key: 'date_to', label: `To: ${dateTo}`, value: dateTo }] : []),
  ];

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const handleRemoveFilter = (key: string) => {
    if (key === 'date_from') {
      setDateFrom('');
      return;
    }
    if (key === 'date_to') {
      setDateTo('');
      return;
    }
    setFilters((f) => ({ ...f, [key]: undefined }));
  };

  if (isLoading) return <LoadingState color="#0891b2" message="Loading payments..." />;
  if (isError)
    return <ErrorState message="Failed to load payments" onRetry={() => void refetch()} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0891b2', '#22d3ee']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-dashboard')}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSub}>{data?.totalCount ?? 0} total payments</Text>
          </View>
          {/* Analytics toggle for date filters */}
          <TouchableOpacity
            style={[styles.headerIconBtn, showDatePickers && styles.headerIconBtnActive]}
            onPress={() => setShowDatePickers((v) => !v)}
          >
            <TrendingUp size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatCard
          label="Collected"
          value={`₹${(dashboard?.total_collected ?? 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee size={20} color="#fff" />}
          gradientColors={['#059669', '#10b981']}
          delay={100}
        />
        <StatCard
          label="Payments"
          value={String(data?.totalCount ?? 0)}
          icon={<CreditCard size={20} color="#fff" />}
          gradientColors={['#7c3aed', '#a78bfa']}
          delay={150}
        />
        <StatCard
          label="Collection %"
          value={`${dashboard?.collection_percentage ?? 0}%`}
          icon={<Percent size={20} color="#fff" />}
          gradientColors={['#0891b2', '#38bdf8']}
          delay={200}
        />
      </View>

      {/* ── Search + Filter icon ───────────────────────────────── */}
      <View style={styles.searchBox}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={() => setAppliedSearch(search.trim())}
          onClear={() => {
            setSearch('');
            setAppliedSearch('');
          }}
          placeholder="Search by student or receipt..."
          onFilterPress={() => setShowFilterModal(true)}
          activeFilterCount={activeFilterCount}
        />
      </View>

      {/* ── Active Filter Chips ────────────────────────────────── */}
      <ActiveFilters
        filters={activeFilterLabels}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearFilters}
      />

      {/* ── Date range pickers (toggled by analytics button) ───── */}
      {showDatePickers && (
        <Animated.View entering={FadeInDown} style={styles.datePanel}>
          <Text style={styles.datePanelTitle}>📅 Filter by Date Range</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <FormDatePicker
                label="From Date"
                value={dateFrom}
                onChange={setDateFrom}
                minYear={2020}
                maxYear={2030}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormDatePicker
                label="To Date"
                value={dateTo}
                onChange={setDateTo}
                minYear={2020}
                maxYear={2030}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Filter Modal (same pattern as Teachers) ────────────── */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilters={filters as unknown as Record<string, unknown>}
        onApply={handleApplyFilters}
        fields={PAYMENT_FILTER_FIELDS}
        title="Filter Payments"
      />

      {/* ── Payments List ─────────────────────────────────────── */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.public_id}
        renderItem={({ item, index }) => <PaymentCard item={item} index={index} />}
        contentContainerStyle={styles.list}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => void refetch()}
            tintColor="#0891b2"
          />
        }
        ListFooterComponent={<ListFooter isLoading={isFetchingNextPage} color="#0891b2" />}
        ListEmptyComponent={
          <EmptyState
            icon={<CreditCard size={48} color="#cbd5e1" />}
            message="No payments found"
            subMessage="Try adjusting your filters"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // ── Header ────────────────────────────────────────────────────
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
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 20,
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
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // ── Stat Cards ────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  statCardWrapper: { flex: 1 },
  statCard: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: { fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 2 },

  // ── Search / Filters ──────────────────────────────────────────
  searchBox: { paddingHorizontal: 14, paddingTop: 10 },
  datePanel: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  datePanelTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 4 },
  dateRow: { flexDirection: 'row', gap: 10 },

  // ── List ──────────────────────────────────────────────────────
  list: { padding: 14, gap: 10, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRefund: { borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  receiptNo: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  amount: { fontSize: 16, fontWeight: '800' },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  utr: { fontSize: 11, color: '#64748b' },
  receivedBy: { fontSize: 11, color: '#94a3b8', marginLeft: 'auto' },
});
