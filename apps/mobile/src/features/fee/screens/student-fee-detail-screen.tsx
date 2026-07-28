/**
 * Student Fee Detail Screen
 * Full breakdown of a student's fee: components, payment history, actions
 */

import { FeeStatus, type ReminderChannelType } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  CreditCard,
  IndianRupee,
  Bell,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  AlertCircle,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ErrorState, LoadingState } from '@/components/common/ListStates';
import { RecordPaymentModal } from '@/features/fee/components/record-payment-modal';
import { SendReminderModal } from '@/features/fee/components/send-reminder-modal';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';

import { FeeProgress } from '../components/fee-amount';
import { FeeStatusBadge } from '../components/fee-status-badge';
import { PaymentModeBadge } from '../components/payment-mode-badge';
import { useStudentFee, usePayments, useSendFeeReminder } from '../hooks';

// ─── Component Row ────────────────────────────────────────────────────────────

interface ComponentRowProps {
  name: string;
  amount: number;
  isSelected: boolean;
}

const ComponentRow = ({ name, amount, isSelected }: ComponentRowProps) => (
  <View style={styles.componentRow}>
    <View style={styles.componentLeft}>
      {isSelected ? (
        <CheckCircle2 size={16} color="#059669" />
      ) : (
        <XCircle size={16} color="#94a3b8" />
      )}
      <Text
        style={[styles.componentName, !isSelected && styles.componentNameMuted]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
    <Text
      style={[
        styles.componentAmount,
        !isSelected && styles.componentAmountMuted,
      ]}
    >
      ₹{amount.toLocaleString('en-IN')}
    </Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StudentFeeDetailScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'FeeStudentDetail'>>();
  const { id } = route.params;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const [showPayment, setShowPayment] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const {
    data: fee,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useStudentFee(id ?? '');
  const { data: paymentsData } = usePayments({ student_fee_public_id: id });

  const { mutate: sendReminder, isPending: reminderPending } =
    useSendFeeReminder();
  const handleReminder = () => {
    setShowReminderModal(true);
  };
  const handleReminderSend = (channel: ReminderChannelType) => {
    if (!id) return;
    sendReminder(
      { student_fee_public_id: id, delivery_methods: [channel] },
      {
        onSuccess: () => {
          setShowReminderModal(false);
        },
      },
    );
  };

  if (isLoading)
    return <LoadingState color="#7c3aed" message="Loading fee details..." />;
  if (isError || !fee)
    return (
      <ErrorState
        message="Failed to load fee details"
        onRetry={() => void refetch()}
      />
    );

  const payments = paymentsData?.items ?? [];
  const paidAmount = Number(fee.amount_paid);
  const totalAmount = Number(fee.final_amount);
  const discountAmount = Number(fee.discount_amount ?? 0);
  const isRefunding = fee.status === FeeStatus.REFUNDING;
  const isRefunded = fee.status === FeeStatus.REFUNDED;
  const isOverpaid = fee.status === FeeStatus.OVERPAID;
  const isRefundFlow = isRefunding || isRefunded;
  const showRefundPayment = isRefunding || isOverpaid;
  const showRecordPayment =
    !isRefundFlow &&
    !isOverpaid &&
    fee.status !== FeeStatus.PAID &&
    fee.status !== FeeStatus.WAIVED;
  const balanceColor = isRefunding || isRefunded ? '#ea580c' : '#dc2626';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
        <Animated.View entering={FadeIn} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {fee.student_name}
            </Text>
            <Text style={styles.headerSub}>{fee.class_name}</Text>
          </View>
          {!isRefundFlow && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate('FeeStudentEdit', { id: fee.public_id })
              }
            >
              <Pencil size={16} color="#fff" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
          <FeeStatusBadge status={fee.status} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#7c3aed"
          />
        }
      >
        {/* Summary card */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.summaryCard}
        >
          <Text style={styles.sectionTitle}>Fee Summary</Text>
          <FeeProgress amountPaid={paidAmount} totalAmount={totalAmount} />

          {isRefunding && (
            <View style={styles.refundInfoTag}>
              <AlertCircle size={14} color="#c2410c" />
              <Text style={styles.refundInfoText}>
                Admin refund processing in progress
              </Text>
            </View>
          )}

          {isOverpaid && (
            <View style={styles.refundInfoTag}>
              <AlertCircle size={14} color="#c2410c" />
              <Text style={styles.refundInfoText}>
                Excess paid: ₹
                {(paidAmount - totalAmount).toLocaleString('en-IN')} — eligible
                for refund
              </Text>
            </View>
          )}

          <View style={styles.amountGrid}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={[styles.amountValue, styles.amountValueDark]}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountValue, styles.amountValueGreen]}>
                ₹{paidAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>
                {isRefunding || isRefunded ? 'Refundable' : 'Balance'}
              </Text>
              <Text style={[styles.amountValue, { color: balanceColor }]}>
                ₹
                {(isRefunding || isRefunded
                  ? paidAmount
                  : totalAmount - paidAmount
                ).toLocaleString('en-IN')}
              </Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Discount</Text>
                <Text style={[styles.amountValue, styles.amountValueAmber]}>
                  ₹{discountAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
          </View>

          {fee.due_date && (
            <View style={styles.dueRow}>
              <Clock size={13} color="#94a3b8" />
              <Text style={styles.dueText}>Due: {fee.due_date}</Text>
            </View>
          )}
        </Animated.View>

        {/* Fee Components */}
        {fee.components && fee.components.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.card}>
            <View style={styles.cardHeader}>
              <BookOpen size={16} color="#7c3aed" />
              <Text style={styles.sectionTitle}>Fee Components</Text>
            </View>
            {fee.components.map(comp => (
              <ComponentRow
                key={comp.public_id ?? comp.name}
                name={comp.name}
                amount={Number(comp.amount)}
                isSelected={comp.is_selected}
              />
            ))}
          </Animated.View>
        )}

        {/* Payment History */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={16} color="#7c3aed" />
            <Text style={styles.sectionTitle}>
              Payment History ({payments.length})
            </Text>
          </View>
          {payments.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>
                No payments recorded yet
              </Text>
            </View>
          ) : (
            payments.map(pay => (
              <View key={pay.public_id} style={styles.paymentRow}>
                <View style={styles.flex1}>
                  <Text
                    style={[
                      styles.paymentAmount,
                      pay.transaction_type === 'debit' &&
                        styles.paymentAmountDebit,
                    ]}
                  >
                    {pay.transaction_type === 'debit' ? '-' : '+'}₹
                    {Number(pay.amount).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.paymentDate}>{pay.payment_date}</Text>
                </View>
                <View style={styles.alignEndGap}>
                  <PaymentModeBadge mode={pay.payment_mode} size="sm" />
                  <Text style={styles.receiptNo}>#{pay.receipt_number}</Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.delay(250)}
          style={styles.actionsRow}
        >
          {showRefundPayment && (
            <TouchableOpacity
              style={[styles.primaryBtn, styles.primaryBtnOrange]}
              onPress={() => setShowPayment(true)}
            >
              <CreditCard size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Refund Payment</Text>
            </TouchableOpacity>
          )}

          {isRefunded && (
            <View style={[styles.primaryBtn, styles.primaryBtnBlueDim]}>
              <CheckCircle2 size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Refunded</Text>
            </View>
          )}

          {showRecordPayment && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleReminder}
              disabled={reminderPending}
            >
              <Bell size={16} color="#7c3aed" />
              <Text style={styles.secondaryBtnText}>Send Reminder</Text>
            </TouchableOpacity>
          )}
          {showRecordPayment && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowPayment(true)}
            >
              <IndianRupee size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Record Payment</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      <RecordPaymentModal
        studentFee={fee}
        mode={showRefundPayment ? 'refund' : 'payment'}
        visible={showPayment}
        onClose={() => setShowPayment(false)}
      />

      <SendReminderModal
        visible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        studentFee={fee}
        onSend={handleReminderSend}
        isLoading={reminderPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -40,
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  editBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  scroll: { padding: 14, gap: 12, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  amountItem: { flex: 1, minWidth: '40%' },
  amountLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: { fontSize: 18, fontWeight: '800' },

  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  dueText: { fontSize: 12, color: '#94a3b8' },
  refundInfoTag: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refundInfoText: {
    fontSize: 12,
    color: '#c2410c',
    fontWeight: '600',
  },

  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  componentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  componentName: { fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1 },
  mandatoryBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  mandatoryText: { fontSize: 10, color: '#0891b2', fontWeight: '700' },
  componentAmount: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

  emptyHistory: { paddingVertical: 20, alignItems: 'center' },
  emptyHistoryText: { fontSize: 13, color: '#94a3b8' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  paymentAmount: { fontSize: 15, fontWeight: '700', color: '#059669' },
  paymentDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  receiptNo: { fontSize: 11, color: '#94a3b8' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#7c3aed' },
  headerTextWrap: { flex: 1, marginLeft: 10 },
  flex1: { flex: 1 },
  alignEndGap: { alignItems: 'flex-end', gap: 4 },
  componentNameMuted: { color: '#94a3b8' },
  componentAmountMuted: { color: '#94a3b8' },
  amountValueDark: { color: '#1e293b' },
  amountValueGreen: { color: '#059669' },
  amountValueAmber: { color: '#f59e0b' },
  paymentAmountDebit: { color: '#dc2626' },
  primaryBtnOrange: { backgroundColor: '#ea580c' },
  primaryBtnBlueDim: { backgroundColor: '#0284c7', opacity: 0.7 },
});
