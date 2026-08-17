/**
 * Feedback Screen - submit feedback and rate the app
 */

import {
  FEEDBACK_DESCRIPTION_MAX_LENGTH,
  FEEDBACK_MAX_ATTACHMENTS,
  FEEDBACK_MAX_ATTACHMENT_SIZE,
  FEEDBACK_MODULE_OPTIONS,
  FEEDBACK_SUBJECT_MAX_LENGTH,
  FEEDBACK_TYPE,
  FEEDBACK_TYPE_OPTIONS,
  getRoleGradient,
  type FeedbackTypeIconName,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
  MessageCircle,
  Send,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/common';
import {
  FormAttachmentPicker,
  FormDropdown,
  FormInput,
  type SelectedFile,
} from '@/components/forms';
import {
  useCreateFeedback,
  useMyReview,
  useSubmitReview,
} from '@/features/feedback';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { StarRating } from './StarRating';
import { styles } from './feedback-styles';

/** Same icon names as web, resolved against the native icon set. */
const TYPE_ICONS: Record<FeedbackTypeIconName, LucideIcon> = {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
};

const MODULE_OPTIONS = FEEDBACK_MODULE_OPTIONS.map(option => ({
  value: option.value,
  label: option.label,
}));

const ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

type Tab = 'feedback' | 'review';
type FieldErrors = Record<string, string>;

export default function FeedbackScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const gradient = useMemo(() => getRoleGradient(user?.role), [user?.role]);

  const [tab, setTab] = useState<Tab>('feedback');

  const [feedbackType, setFeedbackType] = useState<string>(
    FEEDBACK_TYPE.SUGGESTION,
  );
  const [module, setModule] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<SelectedFile[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [ratingError, setRatingError] = useState<string | null>(null);

  const { data: myReview, isLoading: reviewLoading } = useMyReview();
  const existingReview = myReview?.data ?? null;

  const createFeedback = useCreateFeedback({
    onSuccess: () => {
      setSubject('');
      setDescription('');
      setModule('');
      setAttachments([]);
      setFeedbackType(FEEDBACK_TYPE.SUGGESTION);
      setErrors({});
    },
    onError: (_error, fieldErrors) => {
      if (fieldErrors) {
        setErrors(fieldErrors);
      }
    },
  });

  const submitReviewMutation = useSubmitReview();

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setReview(existingReview.review);
    }
  }, [existingReview]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleSubmitFeedback = () => {
    const nextErrors: FieldErrors = {};
    if (!subject.trim()) {
      nextErrors.subject = 'Subject is required';
    }
    if (!description.trim()) {
      nextErrors.description = 'Description is required';
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    createFeedback.mutate({
      feedback_type: feedbackType,
      module: module || undefined,
      subject: subject.trim(),
      description: description.trim(),
      attachments,
    });
  };

  const handleSubmitReview = () => {
    if (!rating) {
      setRatingError('Please select a rating');
      return;
    }
    setRatingError(null);
    submitReviewMutation.mutate({ rating, review: review.trim() });
  };

  const renderFeedbackTab = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          FEEDBACK TYPE <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.typeGrid}>
          {FEEDBACK_TYPE_OPTIONS.map(option => {
            const Icon = TYPE_ICONS[option.icon];
            const isSelected = feedbackType === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setFeedbackType(option.value)}
                style={[
                  styles.typeCard,
                  isSelected && {
                    borderColor: option.borderColor,
                    backgroundColor: option.bgColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.typeIconWrap,
                    { backgroundColor: option.bgColor },
                  ]}
                >
                  <Icon size={18} color={option.color} />
                </View>
                <Text style={styles.typeLabel}>{option.label}</Text>
                <Text style={styles.typeDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <FormDropdown
          label="Module"
          options={MODULE_OPTIONS}
          value={module}
          onChange={setModule}
          placeholder="Which area is this about? (optional)"
          emptyMessage="No modules found"
        />

        <FormInput
          label="Subject"
          required
          value={subject}
          onChangeText={setSubject}
          error={errors.subject}
          maxLength={FEEDBACK_SUBJECT_MAX_LENGTH}
          placeholder={
            feedbackType === FEEDBACK_TYPE.COMPLAINT
              ? 'Briefly, what went wrong?'
              : 'Summarise your feedback in a line'
          }
        />

        <FormInput
          label="Description"
          required
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          maxLength={FEEDBACK_DESCRIPTION_MAX_LENGTH}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder="Tell us what happened, what you expected, and anything that would help us act on it."
          style={styles.descriptionInput}
        />
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            {description.length}/{FEEDBACK_DESCRIPTION_MAX_LENGTH}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <FormAttachmentPicker
          files={attachments}
          onChange={setAttachments}
          maxFiles={FEEDBACK_MAX_ATTACHMENTS}
          maxFileSize={FEEDBACK_MAX_ATTACHMENT_SIZE}
          allowedTypes={ATTACHMENT_MIME_TYPES}
          label={`Attachments (up to ${FEEDBACK_MAX_ATTACHMENTS})`}
          buttonText="Add attachment"
          hint="Screenshots or documents — JPEG, PNG, WebP or PDF (max 5MB each)"
        />
      </View>
    </>
  );

  const renderReviewTab = () => {
    if (reviewLoading) {
      return (
        <View style={styles.section}>
          <ActivityIndicator color="#2563eb" />
        </View>
      );
    }

    return (
      <>
        {existingReview && (
          <View style={styles.infoBanner}>
            <CheckCircle2 size={16} color="#047857" />
            <Text style={styles.infoBannerText}>
              You have already rated us. Submitting again updates your review.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingPrompt}>
              How would you rate your experience?
            </Text>
            <StarRating value={rating} onChange={setRating} />
            {ratingError && <Text style={styles.errorText}>{ratingError}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <FormInput
            label="Your review"
            value={review}
            onChangeText={setReview}
            maxLength={FEEDBACK_DESCRIPTION_MAX_LENGTH}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholder="What do you like, and what would make it a 5-star experience?"
            style={styles.reviewInput}
          />
        </View>
      </>
    );
  };

  const isFeedbackTab = tab === 'feedback';

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={gradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Feedback</Text>
              <Text style={headerStyles.subtitle}>
                Help us make the app better
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, isFeedbackTab && styles.segmentActive]}
            onPress={() => setTab('feedback')}
          >
            <Text
              style={[
                styles.segmentText,
                isFeedbackTab && styles.segmentTextActive,
              ]}
            >
              Share feedback
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, !isFeedbackTab && styles.segmentActive]}
            onPress={() => setTab('review')}
          >
            <Text
              style={[
                styles.segmentText,
                !isFeedbackTab && styles.segmentTextActive,
              ]}
            >
              Rate us
            </Text>
          </TouchableOpacity>
        </View>

        {isFeedbackTab ? renderFeedbackTab() : renderReviewTab()}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {isFeedbackTab ? (
          <SubmitButton
            label="Submit feedback"
            icon={Send}
            isLoading={createFeedback.isPending}
            onPress={handleSubmitFeedback}
          />
        ) : (
          <SubmitButton
            label={existingReview ? 'Update review' : 'Submit review'}
            icon={Star}
            variant="warning"
            isLoading={submitReviewMutation.isPending}
            onPress={handleSubmitReview}
          />
        )}
      </View>
    </View>
  );
}
