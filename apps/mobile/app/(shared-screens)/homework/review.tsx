/**
 * Submission Review Screen
 * Displays submission details and allows teacher to submit feedback
 * Includes prev/next navigation between submissions
 *
 * Permissions:
 * - The assigned teacher OR the subject teacher can submit reviews
 * - Admin and class teacher can view but NOT submit reviews
 * - Backend enforces this permission
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
import type { HomeworkSubmissionDetail, SubmissionStatus } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  useSubmissionDetail,
  useSubmissions,
  useReviewSubmission,
  useHomeworkDetail,
} from '@/features/homework';
import { useUserProfile } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

export default function ReviewScreen() {
  const router = useRouter();
  const { homework_id, submission_id, index, total } = useLocalSearchParams<{
    homework_id: string;
    submission_id: string;
    index: string;
    total: string;
  }>();

  const { user } = useAuthStore();
  const { data: profile } = useUserProfile();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = parseInt(index ?? '0', 10);
  const totalCount = parseInt(total ?? '0', 10);

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
    // Both assigned teacher and subject teacher can review
    const isAssignedTeacher = homework.assigned_by_public_id === profile.teacher_public_id;
    const isSubjectTeacher = homework.subject_teacher_public_id === profile.teacher_public_id;
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
      router.replace(
        `/(shared-screens)/homework/review?homework_id=${homework_id}&submission_id=${prevSubmission.public_id}&index=${currentIndex - 1}&total=${totalCount}`
      );
    }
  };

  const handleNext = () => {
    if (currentIndex >= totalCount - 1) return;
    const nextSubmission = submissions[currentIndex + 1];
    if (nextSubmission) {
      router.replace(
        `/(shared-screens)/homework/review?homework_id=${homework_id}&submission_id=${nextSubmission.public_id}&index=${currentIndex + 1}&total=${totalCount}`
      );
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
          Alert.alert('Success', 'Review submitted successfully');
          void refetch();
        },
        onError: (error: unknown) => {
          setIsSubmitting(false);
          const message = extractApiError(error, 'Failed to submit review');
          Alert.alert('Error', message);
        },
      }
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
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackBtnText}>{HOMEWORK_UI.GO_BACK}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = SUBMISSION_STATUS_COLORS[submission.status as SubmissionStatus];

  return (
    <KeyboardAvoidingView
      style={layoutStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{HOMEWORK_UI.REVIEW_SUBMISSION}</Text>
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
          <ChevronLeft size={18} color={currentIndex <= 0 ? Colors.gray[300] : Colors.gray[600]} />
          <Text style={[styles.navBtnText, currentIndex <= 0 && styles.navBtnTextDisabled]}>
            {HOMEWORK_UI.PREVIOUS_STUDENT}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex >= totalCount - 1 && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={currentIndex >= totalCount - 1}
        >
          <Text
            style={[styles.navBtnText, currentIndex >= totalCount - 1 && styles.navBtnTextDisabled]}
          >
            {HOMEWORK_UI.NEXT_STUDENT}
          </Text>
          <ChevronRight
            size={18}
            color={currentIndex >= totalCount - 1 ? Colors.gray[300] : Colors.gray[600]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Info Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.studentCard}>
          <View style={styles.studentAvatar}>
            <User size={24} color={Colors.gray[400]} />
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{submission.student_name}</Text>
            <Text style={styles.rollNumber}>
              {HOMEWORK_UI.ROLL}: {submission.student_roll_number}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getSubmissionStatusLabel(submission.status as SubmissionStatus)}
            </Text>
          </View>
        </Animated.View>

        {/* Submission Details */}
        {submission.status !== SUBMISSION_STATUS.PENDING && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Clock size={14} color={Colors.gray[400]} />
                <Text style={styles.detailText}>
                  Submitted: {formatDate(submission.submitted_at)}
                </Text>
              </View>
              {submission.is_late && (
                <View style={styles.lateBadge}>
                  <AlertTriangle size={12} color="#dc2626" />
                  <Text style={styles.lateText}>{HOMEWORK_UI.LATE}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Student Notes */}
        {submission.notes && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>{HOMEWORK_UI.STUDENT_NOTES}</Text>
            <View style={styles.notesCard}>
              <MessageSquare size={16} color={Colors.gray[400]} />
              <Text style={styles.notesText}>{submission.notes}</Text>
            </View>
          </Animated.View>
        )}

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {HOMEWORK_UI.ATTACHMENTS} ({submission.attachments.length})
            </Text>
            {submission.attachments.map((attachment) => (
              <TouchableOpacity
                key={attachment.public_id}
                style={styles.attachmentCard}
                onPress={() => handleOpenAttachment(attachment.url)}
              >
                <Paperclip size={16} color={Colors.gray[400]} />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.file_name}
                  </Text>
                  <Text style={styles.attachmentSize}>{formatFileSize(attachment.file_size)}</Text>
                </View>
                <ExternalLink size={14} color={Colors.gray[400]} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Review Status */}
        {isAlreadyReviewed && submission.reviewed_by_name && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <View style={styles.reviewedInfo}>
              <CheckCircle size={18} color="#10b981" />
              <View>
                <Text style={styles.reviewedText}>
                  {HOMEWORK_UI.REVIEWED_BY} {submission.reviewed_by_name}
                </Text>
                {submission.reviewed_at && (
                  <Text style={styles.reviewedDate}>{formatDate(submission.reviewed_at)}</Text>
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
              <Text style={styles.feedbackHint}>{HOMEWORK_UI.FEEDBACK_IS_OPTIONAL}</Text>
            </>
          ) : (
            <View style={styles.feedbackReadonly}>
              <Text style={styles.feedbackReadonlyText}>
                {submission.feedback || HOMEWORK_UI.FEEDBACK_PLACEHOLDER_READONLY}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Permission Notice for View Only */}
        {!canReview && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.permissionNotice}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Text style={styles.permissionText}>
              {HOMEWORK_UI.VIEW_ONLY}: {HOMEWORK_UI.ONLY_ASSIGNED_TEACHER_CAN_REVIEW}
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      {canSubmitReview && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.submitBtnText}>{HOMEWORK_UI.SUBMIT_REVIEW}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Update Button for Already Reviewed */}
      {canReview && isAlreadyReviewed && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.updateBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : (
              <>
                <FileText size={18} color={Colors.primary[500]} />
                <Text style={styles.updateBtnText}>{HOMEWORK_UI.UPDATE_REVIEW}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.gray[400],
    marginTop: 12,
  },
  goBackBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
  },
  goBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.gray[50],
  },
  navBtnDisabled: {
    backgroundColor: Colors.gray[50],
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  navBtnTextDisabled: {
    color: Colors.gray[300],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  rollNumber: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  lateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  notesCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 22,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
  },
  attachmentSize: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 2,
  },
  reviewedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#dcfce7',
    padding: 14,
    borderRadius: 10,
  },
  reviewedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  reviewedDate: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.gray[800],
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  feedbackHint: {
    fontSize: 11,
    color: Colors.gray[400],
    marginTop: 6,
  },
  feedbackReadonly: {
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
  },
  feedbackReadonlyText: {
    fontSize: 14,
    color: Colors.gray[500],
    fontStyle: 'italic',
  },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  permissionText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[50],
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  updateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary[500],
  },
});
