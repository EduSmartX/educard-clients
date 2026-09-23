/**
 * Feedback Detail Screen - full view of a single submitted ticket
 */

import {
  FEEDBACK_STATUS_COLORS,
  getFeedbackTypeOption,
  getRoleGradient,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, ExternalLink, Paperclip } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';

import { useFeedbackDetail } from '@/features/feedback';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './feedback-detail-styles';

const PROGRESS_STEPS = ['Open', 'In Progress', 'Resolved'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FeedbackDetailScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'FeedbackDetail'>>();
  const { user } = useAuthStore();
  const gradient = useMemo(() => getRoleGradient(user?.role), [user?.role]);

  const { data, isLoading } = useFeedbackDetail(route.params.id);
  const feedback = data?.data;

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color="#6366f1" />
        </View>
      );
    }

    if (!feedback) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>This ticket is unavailable.</Text>
        </View>
      );
    }

    const option = getFeedbackTypeOption(feedback.feedback_type);
    const statusStyle = FEEDBACK_STATUS_COLORS[feedback.status];
    const showComments =
      feedback.status_step >= 2 && Boolean(feedback.admin_remarks);

    return (
      <>
        <View style={[styles.card, { borderLeftColor: option.color }]}>
          <View style={styles.topRow}>
            <Text style={styles.subject}>{feedback.subject}</Text>
            <View
              style={[styles.status, { backgroundColor: statusStyle?.bgColor }]}
            >
              <Text style={[styles.statusText, { color: statusStyle?.color }]}>
                {feedback.status_display}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {feedback.ticket_number} · {feedback.feedback_type_display}
            {feedback.module_display ? ` · ${feedback.module_display}` : ''}
          </Text>
          <Text style={styles.meta}>
            Submitted {formatDate(feedback.created_at)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.progressRow}>
            {PROGRESS_STEPS.map((label, index) => {
              const stepNumber = index + 1;
              const isDone = stepNumber <= feedback.status_step;
              return (
                <View key={label} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressDot,
                      isDone && styles.progressDotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.progressDotText,
                        isDone && styles.progressDotTextActive,
                      ]}
                    >
                      {stepNumber}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      isDone && styles.progressLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your feedback</Text>
          <Text style={styles.description}>{feedback.description}</Text>
        </View>

        {showComments ? (
          <View style={styles.remarksCard}>
            <Text style={styles.remarksTitle}>Reviewer comments</Text>
            {feedback.resolved_by_name || feedback.resolved_at ? (
              <Text style={styles.remarksMeta}>
                {[
                  feedback.resolved_by_name,
                  feedback.resolved_at ? formatDate(feedback.resolved_at) : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
            <Text style={styles.remarksText}>{feedback.admin_remarks}</Text>
          </View>
        ) : null}

        {feedback.github_issue_url ? (
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL(feedback.github_issue_url)}
          >
            <ExternalLink size={16} color="#475569" />
            <Text style={styles.linkText}>
              Track on GitHub
              {feedback.github_issue_number
                ? ` #${feedback.github_issue_number}`
                : ''}
            </Text>
          </TouchableOpacity>
        ) : null}

        {feedback.attachments.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {feedback.attachments.map(attachment => (
              <TouchableOpacity
                key={attachment.public_id}
                style={styles.attachmentRow}
                onPress={() => Linking.openURL(attachment.file_url)}
              >
                <Paperclip size={14} color="#64748b" />
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.file_name}
                </Text>
                <Text style={styles.attachmentSize}>
                  {attachment.file_size_display}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={gradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity
              style={headerStyles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Feedback ticket</Text>
              <Text style={headerStyles.subtitle}>Status and updates</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {renderBody()}
      </ScrollView>
    </View>
  );
}
