/**
 * Submission Review Screen
 * Displays submission details and allows the teacher to submit feedback.
 */

import {
  Colors,
  getRoleGradient,
  SUBMISSION_STATUS,
  SUBMISSION_STATUS_COLORS,
  getSubmissionStatusLabel,
  HOMEWORK_UI,
  extractApiError,
} from '@educard/shared';
import type { SubmissionStatus } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  FileText,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useSubmissionDetail,
  useSubmissions,
  useReviewSubmission,
  useHomeworkDetail,
} from '@/features/homework';
import { useUserProfile } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { styles } from './review-styles';

const adminGradient = getRoleGradient('admin');

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${
    sizes[i]
  }`;
}

export default function ReviewScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<SharedStackParamList, 'HomeworkReview'>>();
  const { showToast } = useToast();
  const { homework_id, submission_id, index, total } = route.params;

  const { user } = useAuthStore();
  const { data: profile } = useUserProfile();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = Number.parseInt(index ?? '0', 10);
  const totalCount = Number.parseInt(total ?? '0', 10);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const { data: homework } = useHomeworkDetail(homework_id ?? '');
  const {
    data: submission,
    isLoading,
    refetch,
  } = useSubmissionDetail(homework_id ?? '', submission_id ?? '');
  const { data: submissionsData } = useSubmissions(homework_id ?? '');
  const reviewMutation = useReviewSubmission();

  const submissions = submissionsData?.submissions ?? [];

  const canReview = useMemo(() => {
    if (!homework || !profile) return false;
    if (isAdmin) return false;
    const isAssignedTeacher =
      homework.assigned_by_public_id === profile.teacher_public_id;
    const isSubjectTeacher =
      homework.subject_teacher_public_id === profile.teacher_public_id;
    return isAssignedTeacher || isSubjectTeacher;
  }, [homework, profile, isAdmin]);

  const isAlreadyReviewed = submission?.status === SUBMISSION_STATUS.REVIEWED;
  const canSubmitReview = canReview && !isAlreadyReviewed;

  useEffect(() => {
    if (submission?.feedback) {
      setFeedback(submission.feedback);
    }
  }, [submission]);

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    const prevSubmission = submissions[currentIndex - 1];
    if (prevSubmission) {
      navigation.replace('HomeworkReview', {
        homework_id,
        submission_id: prevSubmission.public_id,
        index: String(currentIndex - 1),
        total: String(totalCount),
      });
    }
  };

  const handleNext = () => {
    if (currentIndex >= totalCount - 1) return;
    const nextSubmission = submissions[currentIndex + 1];
    if (nextSubmission) {
      navigation.replace('HomeworkReview', {
        homework_id,
        submission_id: nextSubmission.public_id,
        index: String(currentIndex + 1),
        total: String(totalCount),
      });
    }
  };

  const handleSubmitReview = () => {
    if (!homework_id || !submission_id) return;

    setIsSubmitting(true);
    reviewMutation.mutate(
      {
        homeworkPublicId: homework_id,
        submissionPublicId: submission_id,
        data: { feedback: feedback.trim() || undefined },
      },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Review submitted successfully',
          });
          void refetch();
        },
        onError: (error: unknown) => {
          setIsSubmitting(false);
          const message = extractApiError(error, 'Failed to submit review');
          showToast({ type: 'error', title: 'Error', message });
        },
      },
    );
  };

  const handleOpenAttachment = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open attachment');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <AlertTriangle size={48} color={Colors.gray[300]} />
        <Text style={styles.errorText}>{HOMEWORK_UI.SUBMISSION_NOT_FOUND}</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={handleBack}>
          <Text style={styles.goBackBtnText}>{HOMEWORK_UI.GO_BACK}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor =
    SUBMISSION_STATUS_COLORS[submission.status as SubmissionStatus];

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>
                {HOMEWORK_UI.REVIEW_SUBMISSION}
              </Text>
              <Text style={headerStyles.subtitle}>
                {currentIndex + 1} of {totalCount}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex <= 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={currentIndex <= 0}
        >
          <ChevronLeft
            size={18}
            color={currentIndex <= 0 ? Colors.gray[300] : Colors.gray[600]}
          />
          <Text
            style={[
              styles.navBtnText,
              currentIndex <= 0 && styles.navBtnTextDisabled,
            ]}
          >
            {HOMEWORK_UI.PREVIOUS_STUDENT}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navBtn,
            currentIndex >= totalCount - 1 && styles.navBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex >= totalCount - 1}
        >
          <Text
            style={[
              styles.navBtnText,
              currentIndex >= totalCount - 1 && styles.navBtnTextDisabled,
            ]}
          >
            {HOMEWORK_UI.NEXT_STUDENT}
          </Text>
          <ChevronRight
            size={18}
            color={
              currentIndex >= totalCount - 1
                ? Colors.gray[300]
                : Colors.gray[600]
            }
          />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        {/* Student Info Card */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.studentCard}
        >
          <View style={styles.studentAvatar}>
            <User size={24} color={Colors.gray[400]} />
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{submission.student_name}</Text>
            <Text style={styles.rollNumber}>
              {HOMEWORK_UI.ROLL}: {submission.student_roll_number}
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
              {getSubmissionStatusLabel(submission.status as SubmissionStatus)}
            </Text>
          </View>
        </Animated.View>

        {/* Submission Details */}
        {submission.status !== SUBMISSION_STATUS.PENDING && (
          <Animated.View
            entering={FadeInDown.delay(150)}
            style={styles.section}
          >
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Clock size={14} color={Colors.gray[400]} />
                <Text style={styles.detailText}>
                  Submitted: {formatDate(submission.submitted_at)}
                </Text>
              </View>
              {!!submission.is_late && (
                <View style={styles.lateBadge}>
                  <AlertTriangle size={12} color="#dc2626" />
                  <Text style={styles.lateText}>{HOMEWORK_UI.LATE}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Student Notes */}
        {!!submission.notes && (
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>{HOMEWORK_UI.STUDENT_NOTES}</Text>
            <View style={styles.notesCard}>
              <MessageSquare size={16} color={Colors.gray[400]} />
              <Text style={styles.notesText}>{submission.notes}</Text>
            </View>
          </Animated.View>
        )}

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(250)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              {HOMEWORK_UI.ATTACHMENTS} ({submission.attachments.length})
            </Text>
            {submission.attachments.map(attachment => (
              <TouchableOpacity
                key={attachment.public_id}
                style={styles.attachmentCard}
                onPress={() => void handleOpenAttachment(attachment.url)}
              >
                <Paperclip size={16} color={Colors.gray[400]} />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.file_name}
                  </Text>
                  <Text style={styles.attachmentSize}>
                    {formatFileSize(attachment.file_size)}
                  </Text>
                </View>
                <ExternalLink size={14} color={Colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Review Status */}
        {isAlreadyReviewed && submission.reviewed_by_name && (
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.section}
          >
            <View style={styles.reviewedInfo}>
              <CheckCircle size={18} color="#10b981" />
              <View>
                <Text style={styles.reviewedText}>
                  {HOMEWORK_UI.REVIEWED_BY} {submission.reviewed_by_name}
                </Text>
                {!!submission.reviewed_at && (
                  <Text style={styles.reviewedDate}>
                    {formatDate(submission.reviewed_at)}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Feedback Section */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>{HOMEWORK_UI.REVIEW_FEEDBACK}</Text>
          {canSubmitReview ? (
            <>
              <TextInput
                style={styles.feedbackInput}
                placeholder={HOMEWORK_UI.FEEDBACK_PLACEHOLDER}
                placeholderTextColor={Colors.gray[400]}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.feedbackHint}>
                {HOMEWORK_UI.FEEDBACK_IS_OPTIONAL}
              </Text>
            </>
          ) : (
            <View style={styles.feedbackReadonly}>
              <Text style={styles.feedbackReadonlyText}>
                {submission.feedback ||
                  HOMEWORK_UI.FEEDBACK_PLACEHOLDER_READONLY}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Permission Notice for View Only */}
        {!canReview && (
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.permissionNotice}
          >
            <AlertTriangle size={16} color="#f59e0b" />
            <Text style={styles.permissionText}>
              {HOMEWORK_UI.VIEW_ONLY}:{' '}
              {HOMEWORK_UI.ONLY_ASSIGNED_TEACHER_CAN_REVIEW}
            </Text>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />

        {/* Submit Button */}
        {canSubmitReview && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {HOMEWORK_UI.SUBMIT_REVIEW}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Update Button for Already Reviewed */}
        {canReview && isAlreadyReviewed && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[
                styles.updateBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              ) : (
                <>
                  <FileText size={18} color={Colors.primary[500]} />
                  <Text style={styles.updateBtnText}>
                    {HOMEWORK_UI.UPDATE_REVIEW}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
