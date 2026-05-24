/**
 * Create Homework Screen
 * Form to create new homework with class/subject pre-selection from URL params
 *
 * URL Params:
 * - class: Pre-selected class public_id
 * - subject: Pre-selected subject public_id
 * - date: Assigned date (YYYY-MM-DD)
 *
 * Permissions:
 * - Admin: Can create homework for any class/subject (uses subject teacher or class teacher)
 * - Class Teacher: Can create for any subject in their class
 * - Subject Teacher: Can only create for subjects they teach
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
  getSubjectColor,
} from '@educard/shared';
import type {
  HomeworkCreatePayload,
  HomeworkStatus,
  HomeworkPriority,
  SubmissionType,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Save, BookOpen, Clock, Link, AlertCircle } from 'lucide-react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormDatePicker, FormAttachmentPicker, type SelectedFile } from '@/components/forms';
import {
  useTeacherClasses,
  useCreateHomework,
  useUploadHomeworkAttachment,
} from '@/features/homework';
import { useFormErrors } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

function getTodayDate(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function CreateHomeworkScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    class?: string;
    subject?: string;
    date?: string;
  }>();

  const { user } = useAuthStore();
  const _isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const { data: teacherClasses = [], isLoading: classesLoading } = useTeacherClasses();
  const createMutation = useCreateHomework();
  const uploadMutation = useUploadHomeworkAttachment();

  // Form errors hook for inline validation
  const { errors, setFieldError, clearFieldError, handleApiError, validateRequired } =
    useFormErrors({
      fieldMap: {
        subject_public_id: 'subject',
        due_datetime: 'dueDate',
      },
    });

  // Form State - Initialize from URL params
  const [selectedClass] = useState<string>(params.class || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(params.subject || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [assignedDate, setAssignedDate] = useState(params.date || getTodayDate());
  const [dueDate, setDueDate] = useState(getTomorrowDate());
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<string>(HOMEWORK_PRIORITY.MEDIUM);
  const [submissionType, setSubmissionType] = useState<string>(SUBMISSION_TYPE.OFFLINE);
  const [referenceLink, setReferenceLink] = useState('');
  const [status, setStatus] = useState<string>(HOMEWORK_STATUS.PUBLISHED);
  const [attachments, setAttachments] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Update form when URL params change
  useEffect(() => {
    if (params.subject && !selectedSubject) {
      setSelectedSubject(params.subject);
    }
    if (params.date && assignedDate === getTodayDate()) {
      setAssignedDate(params.date);
    }
  }, [params, selectedSubject, assignedDate]);

  const selectedClassData = useMemo(
    () => teacherClasses.find((c) => c.public_id === selectedClass),
    [teacherClasses, selectedClass]
  );

  const availableSubjects = useMemo(() => {
    if (!selectedClassData) return [];
    // Show all subjects for the class, backend validates permissions
    return selectedClassData.subjects;
  }, [selectedClassData]);

  const selectedSubjectData = useMemo(
    () => availableSubjects.find((s) => s.public_id === selectedSubject),
    [availableSubjects, selectedSubject]
  );

  const canCreate = useMemo(() => {
    // Admin can create homework for any class/subject
    if (!selectedClass || !selectedSubject || !title.trim()) return false;
    return true;
  }, [selectedClass, selectedSubject, title]);

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
      // Don't fail the whole operation, homework is already created
      Alert.alert('Warning', 'Homework created but some attachments failed to upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const isValid = validateRequired([
      { name: 'subject', value: selectedSubject, label: 'Subject' },
      { name: 'title', value: title, label: 'Title' },
    ]);

    if (!isValid) return;

    // Validate reference link format if provided
    if (referenceLink.trim() && !/^https?:\/\/.+/i.test(referenceLink.trim())) {
      setFieldError('reference_link', 'Enter a valid URL (must start with http:// or https://)');
      return;
    }

    const payload: HomeworkCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      subject_public_id: selectedSubject,
      due_datetime: `${dueDate}T${dueTime}:00`,
      assigned_date: assignedDate,
      status: status as HomeworkStatus,
      priority: priority as HomeworkPriority,
      submission_type: submissionType as SubmissionType,
      reference_link: referenceLink.trim() || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        if (attachments.length > 0 && data?.public_id) void uploadAttachments(data.public_id);
        showToast({ type: 'success', title: 'Success', message: 'Homework created successfully' });
        router.back();
      },
      onError: (error: unknown) => {
        handleApiError(error, 'Failed to create homework');
      },
    });
  };

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Create Homework</Text>
              <Text style={headerStyles.subtitle}>
                {selectedSubjectData
                  ? `${selectedClassData?.name} - ${selectedSubjectData.subject_name}`
                  : selectedClassData?.name || 'New assignment'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Class Display (Readonly) */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Class</Text>
          {classesLoading && <ActivityIndicator size="small" color={Colors.primary[500]} />}
          {!classesLoading && selectedClassData && (
            <View style={styles.readonlyField}>
              <BookOpen size={18} color={Colors.primary[500]} />
              <Text style={styles.readonlyText}>{selectedClassData.name}</Text>
              {!!selectedClassData.is_class_teacher && (
                <View style={styles.ctBadge}>
                  <Text style={styles.ctText}>Class Teacher</Text>
                </View>
              )}
            </View>
          )}
          {!classesLoading && !selectedClassData && (
            <View style={styles.errorField}>
              <AlertCircle size={18} color="#dc2626" />
              <Text style={styles.errorFieldText}>
                No class selected. Please go back and try again.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Subject Selection */}
        {selectedClass && availableSubjects.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
            <Text style={[styles.sectionTitle, errors.subject && styles.sectionTitleError]}>
              Select Subject *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {availableSubjects.map((subject) => {
                const subjectColor = getSubjectColor(subject.subject_name);
                return (
                  <TouchableOpacity
                    key={subject.public_id}
                    style={[
                      styles.chip,
                      errors.subject && styles.chipError,
                      selectedSubject === subject.public_id && [
                        styles.chipSelected,
                        { backgroundColor: subjectColor.hex },
                      ],
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject.public_id);
                      clearFieldError('subject');
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedSubject === subject.public_id && styles.chipTextSelected,
                      ]}
                    >
                      {subject.subject_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {!!errors.subject && (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color="#ef4444" />
                <Text style={styles.errorText}>{errors.subject}</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, errors.title && styles.sectionTitleError]}>
            Title *
          </Text>
          <View style={[styles.inputWrapper, errors.title && styles.inputWrapperError]}>
            <BookOpen size={18} color={errors.title ? '#ef4444' : Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="e.g., Chapter 5 Exercises"
              placeholderTextColor={Colors.gray[400]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                clearFieldError('title');
              }}
              maxLength={255}
            />
          </View>
          {!!errors.title && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color="#ef4444" />
              <Text style={styles.errorText}>{errors.title}</Text>
            </View>
          )}
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <FormDatePicker
                label="Assigned Date"
                value={assignedDate}
                onChange={setAssignedDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormDatePicker label="Due Date" value={dueDate} onChange={setDueDate} />
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
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityContainer}>
            {HOMEWORK_PRIORITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.priorityChip,
                  { borderColor: option.color },
                  priority === option.value && { backgroundColor: option.color },
                ]}
                onPress={() => setPriority(option.value)}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    { color: priority === option.value ? '#fff' : option.color },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Submission Type */}
        <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
          <Text style={styles.sectionTitle}>Submission Type</Text>
          <View style={styles.chipRow}>
            {SUBMISSION_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, submissionType === option.value && styles.chipSelected]}
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
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, errors.reference_link && styles.sectionTitleError]}>
            Reference Link
          </Text>
          <View style={[styles.inputWrapper, errors.reference_link && styles.inputWrapperError]}>
            <Link size={18} color={errors.reference_link ? '#ef4444' : Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="https://example.com/resource"
              placeholderTextColor={Colors.gray[400]}
              value={referenceLink}
              onChangeText={(text) => {
                setReferenceLink(text);
                clearFieldError('reference_link');
              }}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
          {!!errors.reference_link && (
            <View style={styles.errorRow}>
              <AlertCircle size={13} color="#ef4444" />
              <Text style={styles.fieldErrorText}>{errors.reference_link}</Text>
            </View>
          )}
        </Animated.View>

        {/* Attachments */}
        <Animated.View entering={FadeInDown.delay(530)} style={styles.section}>
          <FormAttachmentPicker
            files={attachments}
            onChange={setAttachments}
            maxFiles={5}
            label="Attachments"
            buttonText="Add Attachment"
            hint="Supported: Images, PDF, Word documents (Max 5MB each)"
          />
        </Animated.View>

        {/* Status */}
        <Animated.View entering={FadeInDown.delay(560)} style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.chipRow}>
            {HOMEWORK_STATUS_OPTIONS.slice(0, 2).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, status === option.value && styles.chipSelected]}
                onPress={() => setStatus(option.value)}
              >
                <Text style={[styles.chipText, status === option.value && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </KeyboardAwareScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!canCreate || createMutation.isPending || isUploading) && styles.submitBtnDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={!canCreate || createMutation.isPending || isUploading}
        >
          {createMutation.isPending || isUploading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitBtnText}>
                {isUploading ? 'Uploading...' : 'Creating...'}
              </Text>
            </>
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                Create Homework{attachments.length > 0 ? ` (${attachments.length} files)` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 10,
  },
  sectionTitleError: {
    color: '#dc2626',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: Colors.primary[500],
  },
  chipError: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  chipTextSelected: {
    color: '#fff',
  },
  ctBadge: {
    marginLeft: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ctText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350f',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 10,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.gray[800],
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.gray[800],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    minHeight: 80,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeRow: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 6,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '700',
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
  // Readonly field styles
  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 10,
  },
  readonlyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  errorField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 10,
  },
  errorFieldText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
});
