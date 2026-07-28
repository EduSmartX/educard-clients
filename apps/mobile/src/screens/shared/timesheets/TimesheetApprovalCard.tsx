/**
 * TimesheetApprovalCard - a single submitted-timesheet card for the approvals list.
 * Extracted from the approvals screen to keep it under the 500-line limit.
 */

import { CheckCircle, User, X } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { styles } from './timesheet-approvals-styles';

export interface TimesheetSubmission {
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

export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  SUBMITTED: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  APPROVED: { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  DRAFT: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

export function formatWeekDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface TimesheetApprovalCardProps {
  item: TimesheetSubmission;
  index: number;
  isReviewing: boolean;
  onApprove: (item: TimesheetSubmission) => void;
  onReturn: (item: TimesheetSubmission) => void;
}

export function TimesheetApprovalCard({
  item,
  index,
  isReviewing,
  onApprove,
  onReturn,
}: TimesheetApprovalCardProps) {
  const statusColor =
    STATUS_COLORS[item.submission_status] || STATUS_COLORS.DRAFT;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <User size={20} color="#2563eb" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.employee_info.full_name}</Text>
            <Text style={styles.cardSubtitle}>
              Week: {formatWeekDate(item.week_start_date)} —{' '}
              {formatWeekDate(item.week_end_date)}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor.dot }]}
            />
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
            <Text style={[styles.statValue, styles.statValueGreen]}>
              {item.total_present}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.statValueRed]}>
              {item.total_absent}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.statValuePurple]}>
              {item.total_leaves}
            </Text>
            <Text style={styles.statLabel}>Leave</Text>
          </View>
        </View>

        {item.submission_status === 'SUBMITTED' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onApprove(item)}
              disabled={isReviewing}
            >
              <CheckCircle size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.returnBtn]}
              onPress={() => onReturn(item)}
              disabled={isReviewing}
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
                {item.submission_status === 'APPROVED'
                  ? '✓ Approved by: '
                  : '✗ Rejected by: '}
              </Text>
              <Text style={styles.reviewerName}>{item.reviewed_by_name}</Text>
              {!!item.reviewed_at && (
                <Text style={styles.reviewerDate}>
                  {' '}
                  on {formatWeekDate(item.reviewed_at.split('T')[0])}
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
}
