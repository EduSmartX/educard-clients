/**
 * Parent Fees Screen
 * Shows parent's child fee details
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { FeeStatusBadge } from '../components/fee-status-badge';
import { FeeAmount, FeeProgress } from '../components/fee-amount';
import { useParentStudentFees } from '../hooks/use-fee-queries';
import type { StudentFee } from '@educard/shared';
import { FeeStatus, FEE_UI_TEXT } from '@educard/shared';

export default function ParentFeesScreen() {
  const router = useRouter();
  const { data: feesData, isLoading, refetch } = useParentStudentFees();

  const fees = feesData?.results ?? [];

  // Calculate totals
  const totalAmount = fees.reduce((sum: number, fee: StudentFee) => sum + fee.final_amount, 0);
  const totalPaid = fees.reduce((sum: number, fee: StudentFee) => sum + fee.amount_paid, 0);
  const totalBalance = fees.reduce((sum: number, fee: StudentFee) => sum + fee.balance_due, 0);
  const overdueFees = fees.filter((fee: StudentFee) => fee.is_overdue);

  const handleFeePress = useCallback(
    (fee: StudentFee) => {
      router.push(`/(shared-screens)/fees/${fee.public_id}` as any);
    },
    [router]
  );

  const handlePayPress = useCallback(
    (fee: StudentFee) => {
      router.push(`/(shared-screens)/fees/${fee.public_id}/pay` as any);
    },
    [router]
  );

  const handleViewPayments = useCallback(() => {
    router.push('/(shared-screens)/fees/payments' as any);
  }, [router]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Fees</Text>
          <FeeAmount amount={totalAmount} size="lg" />
          <Text style={styles.summarySubtext}>{fees.length} record(s)</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <FeeAmount amount={totalPaid} size="lg" variant="success" />
          <Text style={styles.summarySubtext}>
            {((totalPaid / totalAmount) * 100 || 0).toFixed(1)}%
          </Text>
        </Card>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <FeeAmount amount={totalBalance} size="lg" variant="danger" />
          {overdueFees.length > 0 && (
            <Text style={styles.overdueText}>{overdueFees.length} overdue</Text>
          )}
        </Card>

        <Card style={[styles.summaryCard, styles.actionCard]}>
          <TouchableOpacity onPress={handleViewPayments}>
            <Text style={styles.actionLabel}>View Payments</Text>
            <Text style={styles.actionSubtext}>Payment history →</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Overdue Alert */}
      {overdueFees.length > 0 && (
        <Card style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ Overdue Payments</Text>
          <Text style={styles.alertText}>
            You have {overdueFees.length} overdue payment(s). Please pay at your earliest
            convenience.
          </Text>
        </Card>
      )}

      {/* Fee List */}
      <Text style={styles.sectionTitle}>Fee Details</Text>

      {fees.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>{FEE_UI_TEXT.EMPTY_STATES.NO_FEES}</Text>
        </Card>
      ) : (
        fees.map((fee: StudentFee) => (
          <FeeCard
            key={fee.public_id}
            fee={fee}
            onPress={() => handleFeePress(fee)}
            onPayPress={() => handlePayPress(fee)}
          />
        ))
      )}
    </ScrollView>
  );
}

interface FeeCardProps {
  fee: StudentFee;
  onPress: () => void;
  onPayPress: () => void;
}

function FeeCard({ fee, onPress, onPayPress }: FeeCardProps) {
  const isOverdue = fee.is_overdue;
  const isPaid = fee.status === FeeStatus.PAID;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.feeCard, isOverdue && styles.overdueCard]}>
        {/* Header */}
        <View style={styles.feeHeader}>
          <View>
            <Text style={styles.feeName}>{fee.fee_structure_name}</Text>
            <Text style={styles.feeSubtext}>
              {fee.academic_year} • {fee.class_name}
            </Text>
          </View>
          <FeeStatusBadge status={fee.status} />
        </View>

        {/* Amounts */}
        <View style={styles.amountsRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total</Text>
            <FeeAmount amount={fee.final_amount} size="sm" />
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Paid</Text>
            <FeeAmount amount={fee.amount_paid} size="sm" variant="success" />
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Balance</Text>
            <FeeAmount
              amount={fee.balance_due}
              size="sm"
              variant={fee.balance_due > 0 ? 'danger' : 'default'}
            />
          </View>
        </View>

        {/* Progress */}
        <FeeProgress
          amountPaid={fee.amount_paid}
          totalAmount={fee.final_amount}
          paidPercentage={fee.paid_percentage ?? 0}
          showLabels={false}
        />

        {/* Due Date */}
        <View style={styles.dueDateRow}>
          <Text style={[styles.dueDateLabel, isOverdue && styles.overdueText]}>
            Due:{' '}
            {fee.due_date
              ? new Date(fee.due_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '-'}
          </Text>

          {!isPaid && (
            <TouchableOpacity style={styles.payButton} onPress={onPayPress}>
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  overdueText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  actionCard: {
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  actionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  alertCard: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#B91C1C',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyCard: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  overdueCard: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  feeSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  dueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dueDateLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  payButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
