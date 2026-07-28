/**
 * Create Homework Screen
 * Form to create new homework with class/subject pre-selection from route params.
 */

import {
  Colors,
  getRoleGradient,
  HOMEWORK_STATUS_OPTIONS,
  HOMEWORK_PRIORITY_OPTIONS,
  SUBMISSION_TYPE_OPTIONS,
  getSubjectColor,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Save,
  BookOpen,
  Clock,
  Link,
  AlertCircle,
} from 'lucide-react-native';
import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormDatePicker, FormAttachmentPicker } from '@/components/forms';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './create-homework-styles';
import {
  getTodayDate,
  useCreateHomeworkForm,
} from './use-create-homework-form';

const adminGradient = getRoleGradient('admin');

export default function CreateHomeworkScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const form = useCreateHomeworkForm();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const {
    selectedClass,
    selectedSubject,
    setSelectedSubject,
    title,
    setTitle,
    description,
    setDescription,
    instructions,
    setInstructions,
    assignedDate,
    setAssignedDate,
    dueDate,
    setDueDate,
    dueTime,
    setDueTime,
    priority,
    setPriority,
    submissionType,
    setSubmissionType,
    chapter,
    setChapter,
    referenceLink,
    setReferenceLink,
    status,
    setStatus,
    attachments,
    setAttachments,
    isUploading,
    classesLoading,
    selectedClassData,
    availableSubjects,
    selectedSubjectData,
    canCreate,
    errors,
    clearFieldError,
    isPending,
    handleSubmit,
  } = form;

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
          {classesLoading && (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          )}
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
          <Animated.View
            entering={FadeInDown.delay(150)}
            style={styles.section}
          >
            <Text
              style={[
                styles.sectionTitle,
                !!errors.subject && styles.sectionTitleError,
              ]}
            >
              Select Subject *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {availableSubjects.map(subject => {
                const subjectColor = getSubjectColor(subject.subject_name);
                const isSelected = selectedSubject === subject.public_id;
                return (
                  <TouchableOpacity
                    key={subject.public_id}
                    style={[
                      styles.chip,
                      !!errors.subject && styles.chipError,
                      isSelected && [
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
                        isSelected && styles.chipTextSelected,
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

        {/* Chapter / Unit */}
        <Animated.View entering={FadeInDown.delay(175)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              !!errors.title && styles.sectionTitleError,
            ]}
          >
            Title *
          </Text>
          <View
            style={[
              styles.inputWrapper,
              !!errors.title && styles.inputWrapperError,
            ]}
          >
            <BookOpen
              size={18}
              color={errors.title ? '#ef4444' : Colors.gray[400]}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g., Chapter 5 Exercises"
              placeholderTextColor={Colors.gray[400]}
              value={title}
              onChangeText={text => {
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
            <View style={styles.flex1}>
              <FormDatePicker
                label="Assigned Date"
                value={assignedDate}
                onChange={v => {
                  setAssignedDate(v);
                  clearFieldError('assigned_date');
                }}
                minDate={getTodayDate()}
                error={errors.assigned_date}
              />
            </View>
            <View style={styles.flex1}>
              <FormDatePicker
                label="Due Date"
                value={dueDate}
                onChange={v => {
                  setDueDate(v);
                  clearFieldError('dueDate');
                }}
                minDate={assignedDate || getTodayDate()}
                error={errors.dueDate}
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
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
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
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              !!errors.reference_link && styles.sectionTitleError,
            ]}
          >
            Reference Link
          </Text>
          <View
            style={[
              styles.inputWrapper,
              !!errors.reference_link && styles.inputWrapperError,
            ]}
          >
            <Link
              size={18}
              color={errors.reference_link ? '#ef4444' : Colors.gray[400]}
            />
            <TextInput
              style={styles.input}
              placeholder="https://example.com/resource"
              placeholderTextColor={Colors.gray[400]}
              value={referenceLink}
              onChangeText={text => {
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
            {HOMEWORK_STATUS_OPTIONS.slice(0, 2).map(option => (
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
      </KeyboardAwareScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!canCreate || isPending || isUploading) &&
              styles.submitBtnDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={!canCreate || isPending || isUploading}
        >
          {isPending || isUploading ? (
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
                Create Homework
                {attachments.length > 0 ? ` (${attachments.length} files)` : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
