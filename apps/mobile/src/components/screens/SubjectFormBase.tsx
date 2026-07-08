/**
 * SubjectFormBase - Shared form UI for Create and Edit Subject screens.
 */

import { getRoleGradient, SUBJECT_TYPE_OPTIONS } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormInput, FormSection, FormError, FormDropdown } from '@/components/forms';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

export interface SubjectFormState {
  class_id: string;
  subject_id: string;
  subject_type: 'core' | 'elective' | 'language';
  teacher_id: string;
  description: string;
  display_order: string;
}

export type FieldErrors = Record<string, string>;

export interface SubjectFormBaseProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  form: SubjectFormState;
  errors: FieldErrors;
  apiError: string | null;
  isSaving: boolean;
  classOpts: { value: string; label: string }[];
  subjectOpts: { value: string; label: string }[];
  subjectsLoading: boolean;
  teacherOpts: { value: string; label: string }[];
  updateField: (field: string, value: string) => void;
  onSubmit: () => void;
  onDismissError: () => void;
  /** Banner content above form (e.g. teacher info) */
  infoBanner?: React.ReactNode;
  /** Extra content rendered after scroll view (e.g. DeletedDuplicateModal) */
  children?: React.ReactNode;
}

export function SubjectFormBase({
  title,
  subtitle,
  submitLabel,
  form,
  errors,
  apiError,
  isSaving,
  classOpts,
  subjectOpts,
  subjectsLoading,
  teacherOpts,
  updateField,
  onSubmit,
  onDismissError,
  infoBanner,
  children,
}: SubjectFormBaseProps) {
  const router = useRouter();

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={[...adminGradient]} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{title}</Text>
              <Text style={headerStyles.subtitle}>{subtitle}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={{ flex: 1 }}
      >
        <FormError message={apiError} onDismiss={onDismissError} />

        {infoBanner}

        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Subject Assignment" icon="📚">
            <FormDropdown
              label="Class"
              required
              options={classOpts}
              value={form.class_id}
              onChange={(v) => updateField('class_id', v)}
              error={errors.class_id}
              placeholder="Select a class"
              searchable
            />
            <FormDropdown
              label="Subject"
              required
              options={subjectOpts}
              value={form.subject_id}
              onChange={(v) => updateField('subject_id', v)}
              error={errors.subject_id}
              placeholder="Select a subject"
              searchable
              loading={subjectsLoading}
            />
            <FormDropdown
              label="Subject Type (Optional)"
              options={SUBJECT_TYPE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={form.subject_type}
              onChange={(v) => updateField('subject_type', v)}
              error={errors.subject_type}
              placeholder="Select subject type"
            />
            <FormDropdown
              label="Teacher"
              options={teacherOpts}
              value={form.teacher_id}
              onChange={(v) => updateField('teacher_id', v)}
              placeholder="Select a teacher (optional)"
              searchable
            />
            <FormInput
              label="Description"
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />
            <FormInput
              label="Display Order (Optional)"
              value={form.display_order}
              onChangeText={(v) => updateField('display_order', v)}
              error={errors.display_order}
              placeholder="e.g. 1 (lower appears first)"
              keyboardType="numeric"
              maxLength={5}
            />
          </FormSection>
        </Animated.View>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSaving}
          style={styles.subBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subGrad}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.subText}>{submitLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {children}
    </View>
  );
}

export const subjectFormStyles = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#dbeafe',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoBannerText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
  subBtn: { marginTop: 8 },
  subGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  subText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

const styles = subjectFormStyles;
