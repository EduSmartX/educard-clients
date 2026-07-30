/**
 * Record Payment Modal
 * Bottom sheet modal to record a payment for a student fee
 */

import {
  PaymentMode,
  PaymentModeOptions,
  TransactionType,
  type PaymentModeType,
  type StudentFee,
  type PaymentCreatePayload,
} from '@educard/shared';
import { X, CreditCard } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { SubmitButton } from '@/components/common/SubmitButton';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormDropdown } from '@/components/forms/FormDropdown';
import { FormInput } from '@/components/forms/FormInput';
import { extractApiError } from '@/utils/api-error';

import { useRecordPayment } from '../hooks';

interface RecordPaymentModalProps {
  studentFee: StudentFee;
  visible: boolean;
  onClose: () => void;
  mode?: 'payment' | 'refund';
}

interface FormErrors {
  amount?: string;
  payment_mode?: string;
  payment_date?: string;
}

const UTR_REQUIRED_MODES = [PaymentMode.UPI, PaymentMode.BANK_TRANSFER];
const CARD_MODES = [PaymentMode.CARD];
const CHEQUE_MODES = [PaymentMode.CHEQUE];

function getDefaultAmount(
  studentFee: StudentFee,
  mode: 'payment' | 'refund',
): string {
  if (mode === 'refund') {
    const refundableFromBalance = Math.abs(Number(studentFee.balance_due || 0));
    const refundable =
      refundableFromBalance > 0
        ? Math.min(refundableFromBalance, Number(studentFee.amount_paid || 0))
        : Number(studentFee.amount_paid || 0);
    return String(Number(refundable.toFixed(2)));
  }
  return String(studentFee.balance_due);
}

export function RecordPaymentModal({
  studentFee,
  visible,
  onClose,
  mode = 'payment',
}: RecordPaymentModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const isRefundMode = mode === 'refund';

  const [amount, setAmount] = useState(getDefaultAmount(studentFee, mode));
  const [paymentMode, setPaymentMode] = useState<string>(PaymentMode.CASH);
  const [paymentDate, setPaymentDate] = useState(today);
  const [utrNumber, setUtrNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const { mutate: recordPayment, isPending } = useRecordPayment();

  useEffect(() => {
    if (!visible) return;
    setAmount(getDefaultAmount(studentFee, mode));
    setPaymentMode(PaymentMode.CASH);
    setPaymentDate(today);
    setUtrNumber('');
    setTransactionId('');
    setRemarks('');
    setBankName('');
    setChequeNumber('');
    setUpiId('');
    setErrors({});
  }, [visible, studentFee, mode, today]);

  const validate = useCallback((): boolean => {
    const e: FormErrors = {};
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      e.amount = 'Enter a valid amount';
    } else if (!isRefundMode && amt > studentFee.balance_due) {
      e.amount = `Amount cannot exceed balance ₹${studentFee.balance_due.toLocaleString('en-IN')}`;
    } else if (isRefundMode && amt > studentFee.amount_paid) {
      e.amount = `Refund cannot exceed paid amount ₹${Number(studentFee.amount_paid).toLocaleString('en-IN')}`;
    }
    if (!paymentMode) e.payment_mode = 'Select payment mode';
    if (!paymentDate) e.payment_date = 'Select payment date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [
    amount,
    isRefundMode,
    studentFee.balance_due,
    studentFee.amount_paid,
    paymentMode,
    paymentDate,
  ]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload: PaymentCreatePayload = {
      student_fee_public_id: studentFee.public_id,
      amount: Number(amount),
      transaction_type: isRefundMode
        ? TransactionType.DEBIT
        : TransactionType.CREDIT,
      payment_mode: paymentMode as PaymentModeType,
      payment_date: paymentDate,
      utr_number: utrNumber || undefined,
      transaction_id: transactionId || undefined,
      remarks: remarks || undefined,
      bank_name: bankName || undefined,
      cheque_number: chequeNumber || undefined,
      upi_id: upiId || undefined,
    };

    recordPayment(payload, {
      onSuccess: () => onClose(),
      onError: (err: Error) => {
        Alert.alert(
          'Error',
          extractApiError(err) ||
            (isRefundMode
              ? 'Failed to record refund'
              : 'Failed to record payment'),
        );
      },
    });
  }, [
    validate,
    studentFee.public_id,
    amount,
    paymentMode,
    paymentDate,
    utrNumber,
    transactionId,
    remarks,
    bankName,
    chequeNumber,
    upiId,
    recordPayment,
    onClose,
    isRefundMode,
  ]);

  const showUtr = (UTR_REQUIRED_MODES as readonly string[]).includes(
    paymentMode,
  );
  const showCard = (CARD_MODES as readonly string[]).includes(paymentMode);
  const showCheque = (CHEQUE_MODES as readonly string[]).includes(paymentMode);
  const showUpi = paymentMode === PaymentMode.UPI;
  const actionLabel = useMemo(
    () => (isRefundMode ? 'Record Refund' : 'Record Payment'),
    [isRefundMode],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CreditCard size={20} color="#059669" />
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>{actionLabel}</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {studentFee.student_name}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Balance info */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Total</Text>
              <Text style={styles.balanceValue}>
                ₹{Number(studentFee.final_amount).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Paid</Text>
              <Text style={[styles.balanceValue, styles.balanceValueGreen]}>
                ₹{Number(studentFee.amount_paid).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>
                {isRefundMode ? 'Refundable' : 'Balance'}
              </Text>
              <Text
                style={[
                  styles.balanceValue,
                  isRefundMode
                    ? styles.balanceValueOrange
                    : styles.balanceValueRed,
                ]}
              >
                ₹
                {Number(
                  isRefundMode
                    ? Math.min(
                        Math.abs(Number(studentFee.balance_due || 0)),
                        Number(studentFee.amount_paid || 0),
                      ) || Number(studentFee.amount_paid || 0)
                    : studentFee.balance_due,
                ).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <KeyboardAwareScrollView
            contentContainerStyle={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            extraScrollHeight={20}
          >
            <FormInput
              label="Amount (₹)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              error={errors.amount}
              required
            />
            <FormDropdown
              label="Payment Mode"
              options={PaymentModeOptions}
              value={paymentMode}
              onChange={setPaymentMode}
              error={errors.payment_mode}
              required
            />
            <FormDatePicker
              label="Payment Date"
              value={paymentDate}
              onChange={setPaymentDate}
              error={errors.payment_date}
              required
              minYear={2020}
              maxYear={2030}
            />

            {/* Mode-specific fields */}
            {showUtr && (
              <FormInput
                label="UTR / Reference Number"
                value={utrNumber}
                onChangeText={setUtrNumber}
                placeholder="12-digit UTR"
                keyboardType="number-pad"
              />
            )}
            {showUpi && (
              <FormInput
                label="UPI ID"
                value={upiId}
                onChangeText={setUpiId}
                placeholder="name@upi"
              />
            )}
            {showCard && (
              <>
                <FormInput
                  label="Transaction ID"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholder="Bank transaction ID"
                />
                <FormInput
                  label="Bank Name"
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. SBI"
                />
              </>
            )}
            {showCheque && (
              <>
                <FormInput
                  label="Cheque Number"
                  value={chequeNumber}
                  onChangeText={setChequeNumber}
                  placeholder="6-digit cheque no."
                  keyboardType="number-pad"
                />
                <FormInput
                  label="Bank Name"
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. HDFC"
                />
              </>
            )}
            <FormInput
              label="Remarks (optional)"
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Any notes..."
              multiline
              numberOfLines={2}
              style={styles.remarksInput}
            />

            <SubmitButton
              label={actionLabel}
              onPress={handleSubmit}
              isLoading={isPending}
              variant={isRefundMode ? 'warning' : 'success'}
            />
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b', maxWidth: 200 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  balanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  form: { padding: 16, gap: 4, paddingBottom: 40 },
  headerTextWrap: { marginLeft: 8 },
  balanceValueGreen: { color: '#059669' },
  balanceValueOrange: { color: '#ea580c' },
  balanceValueRed: { color: '#dc2626' },
  remarksInput: { height: 60, textAlignVertical: 'top' },
});
