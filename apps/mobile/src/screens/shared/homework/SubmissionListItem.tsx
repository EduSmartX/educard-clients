/**
 * SubmissionListItem - one student submission row in the homework submissions list.
 */

import {
  Colors,
  SUBMISSION_STATUS,
  SUBMISSION_STATUS_COLORS,
  getSubmissionStatusLabel,
  HOMEWORK_UI,
} from '@educard/shared';
import type { HomeworkSubmission, SubmissionStatus } from '@educard/shared';
import {
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { styles } from './submissions-styles';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SubmissionListItemProps {
  item: HomeworkSubmission;
  index: number;
  canReview: boolean;
  onView: (submission: HomeworkSubmission, index: number) => void;
}

export function SubmissionListItem({
  item,
  index,
  canReview,
  onView,
}: SubmissionListItemProps) {
  const statusColor = SUBMISSION_STATUS_COLORS[item.status as SubmissionStatus];
  const isPending = item.status === SUBMISSION_STATUS.PENDING;
  const isReviewed = item.status === SUBMISSION_STATUS.REVIEWED;
  const showReview = canReview && !isReviewed;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(400)}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onView(item, index)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.studentAvatar}>
            <User size={18} color={Colors.gray[400]} />
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <Text style={styles.rollNumber}>
              {HOMEWORK_UI.ROLL}: {item.student_roll_number}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getSubmissionStatusLabel(item.status as SubmissionStatus)}
            </Text>
          </View>
        </View>

        {!isPending && (
          <View style={styles.cardDetails}>
            <View style={styles.detailItem}>
              <Clock size={14} color={Colors.gray[400]} />
              <Text style={styles.detailText}>
                {formatDate(item.submitted_at)}
              </Text>
            </View>
            {!!item.is_late && (
              <View style={styles.lateBadge}>
                <AlertTriangle size={12} color="#dc2626" />
                <Text style={styles.lateText}>{HOMEWORK_UI.LATE}</Text>
              </View>
            )}
          </View>
        )}

        {isReviewed && item.reviewed_by_name && (
          <View style={styles.reviewInfo}>
            <CheckCircle size={14} color="#10b981" />
            <Text style={styles.reviewText}>
              {HOMEWORK_UI.REVIEWED_BY} {item.reviewed_by_name}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              showReview ? styles.reviewBtn : styles.viewBtn,
            ]}
            onPress={() => onView(item, index)}
          >
            <Eye size={16} color={showReview ? '#fff' : Colors.primary[500]} />
            <Text
              style={[
                styles.actionBtnText,
                showReview ? styles.reviewBtnText : styles.viewBtnText,
              ]}
            >
              {showReview ? 'Review' : 'View'}
            </Text>
          </TouchableOpacity>
          <ChevronRight size={20} color={Colors.gray[300]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
