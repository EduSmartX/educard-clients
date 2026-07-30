/**
 * ExamNotificationActions - schedule / results / progress notification buttons
 * shown on the exam dashboard.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import type {
  useSendExamScheduleNotification,
  useSendExamResultsNotification,
  useSendExamProgressNotification,
} from '@/features/exams';

import { styles } from './dashboard-styles';

interface ExamNotificationActionsProps {
  hasDraftExams: boolean;
  allExamsCompleted: boolean;
  allMarksPublished: boolean;
  sessionId: string;
  classId: string;
  sendScheduleMutation: ReturnType<typeof useSendExamScheduleNotification>;
  sendResultsMutation: ReturnType<typeof useSendExamResultsNotification>;
  sendProgressMutation: ReturnType<typeof useSendExamProgressNotification>;
}

export function ExamNotificationActions({
  hasDraftExams,
  allExamsCompleted,
  allMarksPublished,
  sessionId,
  classId,
  sendScheduleMutation,
  sendResultsMutation,
  sendProgressMutation,
}: Readonly<ExamNotificationActionsProps>) {
  return (
    <View style={styles.actionButtons}>
      {!hasDraftExams && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnBlue]}
          onPress={() => sendScheduleMutation.mutate({ sessionId, classId })}
          disabled={sendScheduleMutation.isPending}
        >
          <Text style={styles.actionBtnText}>
            {sendScheduleMutation.isPending ? 'Sending...' : '📅 Send Schedule'}
          </Text>
        </TouchableOpacity>
      )}
      {allExamsCompleted && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGreen]}
          onPress={() => sendResultsMutation.mutate({ sessionId, classId })}
          disabled={sendResultsMutation.isPending}
        >
          <Text style={styles.actionBtnText}>
            {sendResultsMutation.isPending
              ? 'Sending...'
              : '📊 Publish Results'}
          </Text>
        </TouchableOpacity>
      )}
      {allMarksPublished && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPurple]}
          onPress={() => sendProgressMutation.mutate({ sessionId, classId })}
          disabled={sendProgressMutation.isPending}
        >
          <Text style={styles.actionBtnText}>
            {sendProgressMutation.isPending ? 'Sending...' : '📈 Send Progress'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
