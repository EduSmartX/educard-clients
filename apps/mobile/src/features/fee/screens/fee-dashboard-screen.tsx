/**
 * Fee Management Dashboard Screen
 * Overview of collection stats, recent payments, quick actions
 */

import type { FeePaymentListItem } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  IndianRupee,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Plus,
  ChevronRight,
  List,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { HeaderProfileButton } from '@/components/common';
import { useAndroidBack } from '@/hooks';

import { FeeStatusBadge, PaymentModeBadge } from '../components';
import { useFeeDashboard, usePayments } from '../hooks';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number = 0): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)} K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  gradient: readonly [string, string];
  icon: React.ReactNode;
}

const StatCard = React.memo(({ label, value, sub, gradient, icon }: StatCardProps) => (
  <LinearGradient colors={gradient} style={styles.statCard}>
    <View style={styles.statIconBox}>{icon}</View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statSub}>{sub}</Text>
  </LinearGradient>
));
StatCard.displayName = 'StatCard';

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  gradient: readonly [string, string];
  onPress: () => void;
}

const QuickAction = React.memo(({ label, icon, gradient, onPress }: QuickActionProps) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
    <LinearGradient colors={gradient} style={styles.quickActionIcon}>
      {icon}
    </LinearGradient>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
));
QuickAction.displayName = 'QuickAction';

// ─── screen ──────────────────────────────────────────────────────────────────

export default function FeeDashboardScreen() {
  const router = useRouter();
  useAndroidBack('/(tabs)/(admin)/management');
  const { data: dashboard, isLoading, refetch, isRefetching } = useFeeDashboard();
  const { data: paymentsData, isLoading: isPaymentsLoading } = usePayments({ page_size: 5 });

  const recentPayments = paymentsData?.items ?? [];
  const pct = dashboard?.collection_percentage ?? 0;

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Fee Management</Text>
            <Text style={styles.headerSubtitle}>Collection overview</Text>
          </View>
          <HeaderProfileButton />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor="#059669" />
        }
      >
        {isLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#059669" />
        ) : (
          <>
            {/* Collection progress */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Collection Progress</Text>
                <Text style={styles.progressPct}>{pct}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: `${Math.min(pct, 100)}%` }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressSub}>
                  {formatCurrency(dashboard?.total_collected)} collected of{' '}
                  {formatCurrency(dashboard?.total_amount)}
                </Text>
              </View>
            </Animated.View>

            {/* Stats grid */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.statsGrid}>
              <StatCard
                label="Total Collected"
                value={formatCurrency(dashboard?.total_collected)}
                sub={`${pct}% of target`}
                gradient={['#059669', '#10b981']}
                icon={<IndianRupee size={22} color="#fff" />}
              />
              <StatCard
                label="Pending"
                value={formatCurrency(dashboard?.total_pending)}
                sub={`${100 - pct}% remaining`}
                gradient={['#d97706', '#f59e0b']}
                icon={<Clock size={22} color="#fff" />}
              />
              <StatCard
                label="Overdue"
                value={String(dashboard?.overdue_count ?? 0)}
                sub="students"
                gradient={['#dc2626', '#ef4444']}
                icon={<AlertTriangle size={22} color="#fff" />}
              />
              <StatCard
                label="Fully Paid"
                value={String(dashboard?.fully_paid_count ?? 0)}
                sub={`of ${dashboard?.total_fees ?? 0} total`}
                gradient={['#0891b2', '#06b6d4']}
                icon={<Users size={22} color="#fff" />}
              />
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <QuickAction
                  label="Fee Structures"
                  gradient={['#0f766e', '#14b8a6']}
                  icon={<List size={20} color="#fff" />}
                  onPress={() => router.push('/(tabs)/(admin)/fee-structures')}
                />
                <QuickAction
                  label="New Structure"
                  gradient={['#059669', '#10b981']}
                  icon={<Plus size={20} color="#fff" />}
                  onPress={() => router.push('/(tabs)/(admin)/fee-structure-form')}
                />
                <QuickAction
                  label="Student Fees"
                  gradient={['#7c3aed', '#a78bfa']}
                  icon={<Users size={20} color="#fff" />}
                  onPress={() => router.push('/(tabs)/(admin)/fee-student-fees')}
                />
                <QuickAction
                  label="All Payments"
                  gradient={['#d97706', '#f59e0b']}
                  icon={<TrendingUp size={20} color="#fff" />}
                  onPress={() => router.push('/(tabs)/(admin)/fee-payments')}
                />
                <QuickAction
                  label="Assign Fee"
                  gradient={['#e11d48', '#fb7185']}
                  icon={<IndianRupee size={20} color="#fff" />}
                  onPress={() => router.push('/(tabs)/(admin)/fee-assign-student')}
                />
              </View>
            </Animated.View>

            {/* Recent Payments */}
            <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Recent Payments</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/(admin)/fee-payments')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              {isPaymentsLoading && <ActivityIndicator color="#059669" style={{ marginTop: 12 }} />}
              {!isPaymentsLoading && recentPayments.length === 0 && (
                <Text style={styles.emptyText}>No payments yet.</Text>
              )}
              {!isPaymentsLoading &&
                recentPayments.length > 0 &&
                recentPayments.map((p: FeePaymentListItem) => (
                  <TouchableOpacity
                    key={p.public_id}
                    style={styles.paymentRow}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/(admin)/fee-payments',
                        params: { highlight: p.public_id },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.paymentLeft}>
                      <Text style={styles.paymentName} numberOfLines={1}>
                        {p.student_name}
                      </Text>
                      <Text style={styles.paymentDate}>{p.payment_date}</Text>
                    </View>
                    <View style={styles.paymentRight}>
                      <Text style={styles.paymentAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                      <PaymentModeBadge mode={p.payment_mode} size="sm" />
                    </View>
                    <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
            </Animated.View>

            {/* Status breakdown */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Status Breakdown</Text>
              <View style={styles.statusGrid}>
                {[
                  {
                    label: 'Fully Paid',
                    count: dashboard?.fully_paid_count ?? 0,
                    status: 'paid' as const,
                  },
                  {
                    label: 'Partial',
                    count: dashboard?.partial_paid_count ?? 0,
                    status: 'partial' as const,
                  },
                  {
                    label: 'Pending',
                    count: dashboard?.pending_count ?? 0,
                    status: 'pending' as const,
                  },
                  {
                    label: 'Overpaid',
                    count: dashboard?.overdue_count ?? 0,
                    status: 'overpaid' as const,
                  },
                ].map(({ label, count, status }) => (
                  <View key={status} style={styles.statusItem}>
                    <FeeStatusBadge status={status} size="sm" />
                    <Text style={styles.statusCount}>{count}</Text>
                    <Text style={styles.statusLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: 20,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },

  // Progress card
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  progressPct: { fontSize: 14, fontWeight: '800', color: '#059669' },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#059669' },
  progressFooter: { marginTop: 8 },
  progressSub: { fontSize: 12, color: '#64748b' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  statCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  // Quick actions
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: '#059669', fontWeight: '600' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickAction: { alignItems: 'center', gap: 6, width: '30%' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  // Recent payments
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  paymentLeft: { flex: 1 },
  paymentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  paymentDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: '#059669' },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },

  // Status breakdown
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center', gap: 4 },
  statusCount: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statusLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
});
