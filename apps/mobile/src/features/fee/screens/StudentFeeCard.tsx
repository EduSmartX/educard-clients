import { FeeStatus } from '@educard/shared';
import type { StudentFee } from '@educard/shared';
import {
  AlertTriangle,
  Bell,
  CreditCard,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  type DimensionValue,
} from 'react-native';

import { FeeStatusBadge } from '../components/fee-status-badge';

import { styles } from './student-fees-styles';

interface StudentFeeCardProps {
  item: StudentFee;
  onRecordPayment: (item: StudentFee) => void;
  onSendReminder: (item: StudentFee) => void;
  onViewDetail: (id: string) => void;
  onEdit: (id: string) => void;
}

function getFeeColor(item: {
  paid_percentage: number;
  is_overdue?: boolean;
}): string {
  if (item.paid_percentage >= 100) return '#059669';
  if (item.paid_percentage >= 50) return '#3b82f6';
  if (item.is_overdue) return '#dc2626';
  return '#f59e0b';
}

export const StudentFeeCard = React.memo(
  ({
    item,
    onRecordPayment,
    onSendReminder,
    onViewDetail,
    onEdit,
  }: StudentFeeCardProps) => {
    const isRefunding = item.status === FeeStatus.REFUNDING;
    const isRefunded = item.status === FeeStatus.REFUNDED;
    const isOverpaid = item.status === FeeStatus.OVERPAID;
    const isRefundFlow = isRefunding || isRefunded;

    const pctColor = getFeeColor(item);
    const fillWidth: DimensionValue = `${Math.min(item.paid_percentage, 100)}%`;
    const balanceColor = item.balance_due > 0 ? '#dc2626' : '#059669';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onViewDetail(item.public_id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.student_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardTitleWrap}>
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
                { width: fillWidth, backgroundColor: pctColor },
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
            <Text style={[styles.amountValue, styles.amountValueGreen]}>
              ₹{Number(item.amount_paid).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={[styles.amountValue, { color: balanceColor }]}>
              ₹{Number(item.balance_due).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {isOverpaid && (
          <View style={styles.overdueTag}>
            <AlertTriangle size={12} color="#dc2626" />
            <Text style={styles.overdueText}>
              Overpaid · Excess ₹
              {(
                Number(item.amount_paid) - Number(item.final_amount)
              ).toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        {isRefunding && (
          <View style={styles.refundInfoTag}>
            <AlertCircle size={12} color="#c2410c" />
            <Text style={styles.refundInfoText}>
              Admin refund processing in progress
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          {(isRefunding || isOverpaid) && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOrange]}
              onPress={() => onRecordPayment(item)}
            >
              <CreditCard size={14} color="#ea580c" />
              <Text style={[styles.actionText, styles.actionTextOrange]}>
                Refund
              </Text>
            </TouchableOpacity>
          )}
          {!(isRefunding || isOverpaid) &&
            !isRefunded &&
            item.status !== FeeStatus.PAID &&
            item.status !== FeeStatus.WAIVED && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGreen]}
                onPress={() => onRecordPayment(item)}
              >
                <CreditCard size={14} color="#059669" />
                <Text style={[styles.actionText, styles.actionTextGreen]}>
                  Pay
                </Text>
              </TouchableOpacity>
            )}

          {!isRefundFlow && !isOverpaid && item.status !== FeeStatus.PAID && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnBlue]}
              onPress={() => onSendReminder(item)}
            >
              <Bell size={14} color="#3b82f6" />
              <Text style={[styles.actionText, styles.actionTextBlue]}>
                Remind
              </Text>
            </TouchableOpacity>
          )}

          {!isRefundFlow && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnViolet]}
              onPress={() => onEdit(item.public_id)}
            >
              <Text style={[styles.actionText, styles.actionTextViolet]}>
                Edit
              </Text>
            </TouchableOpacity>
          )}

          {isRefunded && (
            <View style={[styles.actionBtn, styles.actionBtnBlue]}>
              <Text style={[styles.actionText, styles.actionTextCyan]}>
                Refunded
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGrayAuto]}
            onPress={() => onViewDetail(item.public_id)}
          >
            <Text style={[styles.actionText, styles.actionTextGray]}>
              Details
            </Text>
            <ChevronRight size={14} color="#64748b" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
);
StudentFeeCard.displayName = 'StudentFeeCard';
