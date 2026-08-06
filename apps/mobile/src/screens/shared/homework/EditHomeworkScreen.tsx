/**
 * Edit Homework Screen
 * Form to edit existing homework.
 */

import {
  Colors,
  getRoleGradient,
  HOMEWORK_STATUS,
  HOMEWORK_PRIORITY,
  SUBMISSION_TYPE,
  HOMEWORK_STATUS_OPTIONS,
  HOMEWORK_PRIORITY_OPTIONS,
  SUBMISSION_TYPE_OPTIONS,
  extractApiError,
  getFieldErrors,
} from '@educard/shared';
import type {
  HomeworkUpdatePayload,
  HomeworkStatus,
  HomeworkPriority,
  SubmissionType,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  Save,
  BookOpen,
  Clock,
  Link,
  AlertCircle,
} from 'lucide-react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FormDatePicker,
  FormAttachmentPicker,
  type SelectedFile,
} from '@/components/forms';
import {
  useHomeworkDetail,
  useUpdateHomework,
  useUploadHomeworkAttachment,
} from '@/features/homework';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './edit-homework-styles';

const adminGradient = getRoleGradient('admin');

export default function EditHomeworkScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<SharedStackParamList, 'HomeworkEdit'>>();
  const { showToast } = useToast();
  const { id } = route.params;

  const { user } = useAuthStore();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const { data: homework, isLoading: loadingHomework } = useHomeworkDetail(
    id ?? '',
  );
  const updateMutation = useUpdateHomework();
  const uploadMutation = useUploadHomeworkAttachment();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<string>(HOMEWORK_PRIORITY.MEDIUM);
  const [submissionType, setSubmissionType] = useState<string>(
    SUBMISSION_TYPE.OFFLINE,
  );
  const [chapter, setChapter] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [status, setStatus] = useState<string>(HOMEWORK_STATUS.PUBLISHED);
  const [attachments, setAttachments] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from homework data
  useEffect(() => {
    if (homework && !initialized) {
      setTitle(homework.title || '');
      setDescription(homework.description || '');
      setInstructions(homework.instructions || '');

      if (homework.due_datetime) {
        const dueDateTime = new Date(homework.due_datetime);
        setDueDate(dueDateTime.toISOString().split('T')[0]);
        setDueTime(
          dueDateTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        );
      }

      setPriority(homework.priority || HOMEWORK_PRIORITY.MEDIUM);
      setSubmissionType(homework.submission_type || SUBMISSION_TYPE.OFFLINE);
      setReferenceLink(homework.reference_link || '');
      setChapter(homework.chapter || '');
      setStatus(homework.status || HOMEWORK_STATUS.PUBLISHED);
      setInitialized(true);
    }
  }, [homework, initialized]);

  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    return ['admin', 'super_admin', 'organization_admin'].includes(
      user.role.toLowerCase(),
    );
  }, [user]);

  const isTeacher = useMemo(() => {
    if (!user?.role) return false;
    return ['teacher', 'employee'].includes(user.role.toLowerCase());
  }, [user]);

  const canEdit = useMemo(() => {
    if (!homework || !user) return false;
    if (isAdmin) return true;
    if (isTeacher) return true;
    return false;
  }, [homework, user, isAdmin, isTeacher]);

  const canSave = useMemo(() => {
    if (!canEdit) return false;
    if (!title.trim()) return false;
    return true;
  }, [canEdit, title]);

  const uploadAttachments = async (homeworkId: string) => {
    if (attachments.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as unknown as Blob);

        await uploadMutation.mutateAsync({ publicId: homeworkId, formData });
      }
    } catch {
      Alert.alert(
        'Warning',
        'Homework updated but some attachments failed to upload',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSave || !homework) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const dueDateTime = `${dueDate}T${dueTime}:00`;

    const payload: HomeworkUpdatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      due_datetime: dueDateTime,
      status: status as HomeworkStatus,
      priority: priority as HomeworkPriority,
      submission_type: submissionType as SubmissionType,
      reference_link: referenceLink.trim() || undefined,
      chapter: chapter.trim() || undefined,
    };

    updateMutation.mutate(
      { publicId: homework.public_id, data: payload },
      {
        onSuccess: () => {
          if (attachments.length > 0) {
            void uploadAttachments(homework.public_id);
          }
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Homework updated successfully',
          });
          handleBack();
        },
        onError: (error: unknown) => {
          const fieldErrors = getFieldErrors(error);
          if (Object.keys(fieldErrors).length > 0) {
            const firstField = Object.keys(fieldErrors)[0];
            const message = fieldErrors[firstField];
            showToast({
              type: 'error',
              title: 'Validation Error',
              message: `${firstField.replaceAll('_', ' ')}: ${message}`,
            });
            return;
          }
          const message = extractApiError(error, 'Failed to update homework');
          showToast({ type: 'error', title: 'Error', message });
        },
      },
    );
  };

  if (loadingHomework) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <AlertCircle size={48} color={Colors.gray[300]} />
        <Text style={styles.errorText}>Homework not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={handleBack}>
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View style={[layoutStyles.container, styles.centerContent]}>
        <AlertCircle size={48} color={Colors.gray[300]} />
        <Text style={styles.errorText}>
          You don&apos;t have permission to edit this homework
        </Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={handleBack}>
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              <Text style={headerStyles.title}>Edit Homework</Text>
              <Text style={headerStyles.subtitle}>
                {homework.class_name} • {homework.subject_name}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        {/* Class & Subject Display (Readonly) */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Class & Subject</Text>
          <View style={styles.readonlyField}>
            <BookOpen size={18} color={Colors.primary[500]} />
            <Text style={styles.readonlyText}>
              {homework.class_name} - {homework.subject_name}
            </Text>
          </View>
        </Animated.View>

        {/* Chapter / Unit */}
        <Animated.View entering={FadeInDown.delay(125)} style={styles.section}>
          <Text style={styles.sectionTitle}>Chapter / Unit</Text>
          <View style={styles.inputWrapper}>
            <BookOpen size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Chapter 5 - Photosynthesis"
              placeholderTextColor={Colors.gray[400]}
              value={chapter}
              onChangeText={setChapter}
              maxLength={255}
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <View style={styles.inputWrapper}>
            <BookOpen size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Chapter 5 Exercises"
              placeholderTextColor={Colors.gray[400]}
              value={title}
              onChangeText={setTitle}
              maxLength={255}
            />
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Brief description of the homework..."
            placeholderTextColor={Colors.gray[400]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Detailed instructions for students..."
            placeholderTextColor={Colors.gray[400]}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Dates */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.dateRow}>
            <View style={styles.flex1}>
              <Text style={styles.inputLabel}>Assigned Date</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>
                  {homework.assigned_date}
                </Text>
              </View>
            </View>
            <View style={styles.flex1}>
              <FormDatePicker
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
              />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.inputLabel}>Due Time</Text>
            <View style={styles.inputWrapper}>
              <Clock size={18} color={Colors.gray[400]} />
              <TextInput
                style={styles.input}
                placeholder="17:00"
                placeholderTextColor={Colors.gray[400]}
                value={dueTime}
                onChangeText={setDueTime}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </Animated.View>

        {/* Priority */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityContainer}>
            {HOMEWORK_PRIORITY_OPTIONS.map(option => {
              const priorityTextColor =
                priority === option.value ? '#fff' : option.color;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.priorityChip,
                    { borderColor: option.color },
                    priority === option.value && {
                      backgroundColor: option.color,
                    },
                  ]}
                  onPress={() => setPriority(option.value)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      { color: priorityTextColor },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Submission Type */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Submission Type</Text>
          <View style={styles.chipRow}>
            {SUBMISSION_TYPE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  submissionType === option.value && styles.chipSelected,
                ]}
                onPress={() => setSubmissionType(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    submissionType === option.value && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Reference Link */}
        <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
          <Text style={styles.sectionTitle}>Reference Link</Text>
          <View style={styles.inputWrapper}>
            <Link size={18} color={Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="https://example.com/resource"
              placeholderTextColor={Colors.gray[400]}
              value={referenceLink}
              onChangeText={setReferenceLink}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </Animated.View>

        {/* Existing Attachments Info */}
        {homework.attachments && homework.attachments.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(480)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              Existing Attachments ({homework.attachments.length})
            </Text>
            <View style={styles.existingAttachments}>
              {homework.attachments.map((att, idx) => (
                <View
                  key={att.file_name || `att-${idx}`}
                  style={styles.existingAttachment}
                >
                  <Text style={styles.existingAttachmentText} numberOfLines={1}>
                    {att.file_name || `Attachment ${idx + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* New Attachments */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <FormAttachmentPicker
            files={attachments}
            onChange={setAttachments}
            maxFiles={5}
            label="Add New Attachments"
            buttonText="Add Attachment"
            hint="Supported: Images, PDF, Word documents (Max 5MB each)"
          />
        </Animated.View>

        {/* Status */}
        <Animated.View entering={FadeInDown.delay(530)} style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.chipRow}>
            {HOMEWORK_STATUS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  status === option.value && styles.chipSelected,
                ]}
                onPress={() => setStatus(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    status === option.value && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />

        {/* Submit Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!canSave || updateMutation.isPending || isUploading) &&
                styles.submitBtnDisabled,
            ]}
            onPress={() => void handleSubmit()}
            disabled={!canSave || updateMutation.isPending || isUploading}
          >
            {updateMutation.isPending || isUploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitBtnText}>
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </Text>
              </>
            ) : (
              <>
                <Save size={18} color="#fff" />
                <Text style={styles.submitBtnText}>
                  Save Changes
                  {attachments.length > 0
                    ? ` (${attachments.length} new files)`
                    : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
