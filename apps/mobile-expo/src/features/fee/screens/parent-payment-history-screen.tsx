/**
 * Parent Payment History Screen
 * Shows payment history for parent's child
 */

import type { FeePayment } from '@educard/shared';
import { FEE_UI_TEXT } from '@educard/shared';
import { useRouter } from 'expo-router';
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

import { Card } from '@/components/ui/Card';

import { FeeAmount } from '../components/fee-amount';
import { PaymentModeBadge } from '../components/payment-mode-badge';
import { useParentPaymentHistory } from '../hooks/use-fee-queries';

export default function ParentPaymentHistoryScreen() {
  const _router = useRouter();
  const { data: paymentsData, isLoading, refetch } = useParentPaymentHistory();

  const payments = paymentsData ?? [];

  const handleDownloadReceipt = useCallback((payment: FeePayment) => {
    // TODO: Implement receipt download
    Alert.alert('Download Receipt', `Downloading receipt for ${payment.receipt_number}`);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />}
    >
      {/* Header */}
      <Text style={styles.headerTitle}>{FEE_UI_TEXT.PAGE_TITLES.PAYMENT_HISTORY}</Text>
      <Text style={styles.headerSubtext}>View your payment history and download receipts</Text>

      {/* Payment List */}
      {payments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>{FEE_UI_TEXT.EMPTY_STATES.NO_PAYMENTS}</Text>
        </Card>
      ) : (
        payments.map((payment: FeePayment) => (
          <PaymentCard
            key={payment.public_id}
            payment={payment}
            onDownloadReceipt={() => handleDownloadReceipt(payment)}
          />
        ))
      )}
    </ScrollView>
  );
}

interface PaymentCardProps {
  payment: FeePayment;
  onDownloadReceipt: () => void;
}

function PaymentCard({ payment, onDownloadReceipt }: PaymentCardProps) {
  return (
    <Card style={styles.paymentCard}>
      {/* Header */}
      <View style={styles.paymentHeader}>
        <View style={styles.receiptIcon}>
          <Text style={styles.receiptIconText}>🧾</Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentName}>{payment.fee_structure_name}</Text>
          <PaymentModeBadge mode={payment.payment_mode} size="sm" />
        </View>
        <FeeAmount amount={payment.amount} size="lg" variant="success" />
      </View>

      {/* Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {payment.payment_date
              ? new Date(payment.payment_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '-'}
          </Text>
        </View>
        {payment.receipt_number && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Receipt</Text>
            <Text style={styles.detailValue}>{payment.receipt_number}</Text>
          </View>
        )}
        {payment.transaction_id && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Transaction</Text>
            <Text style={styles.detailValue}>{payment.transaction_id}</Text>
          </View>
        )}
      </View>

      {/* Remarks */}
      {payment.remarks && (
        <View style={styles.remarksRow}>
          <Text style={styles.remarksLabel}>Remarks:</Text>
          <Text style={styles.remarksText}>{payment.remarks}</Text>
        </View>
      )}

      {/* Download Button */}
      <TouchableOpacity style={styles.downloadButton} onPress={onDownloadReceipt}>
        <Text style={styles.downloadButtonText}>📥 Download Receipt</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
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
  paymentCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  receiptIconText: {
    fontSize: 20,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailItem: {
    minWidth: 64,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  remarksRow: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  remarksLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
    color: '#374151',
  },
  downloadButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
