/**
 * ClassFormBase - Shared form UI for Create and Edit Class screens.
 */

import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Save } from 'lucide-react-native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FormInput,
  FormSection,
  FormError,
  FormDropdown,
} from '@/components/forms';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

export interface ClassFormState {
  class_master: string;
  name: string;
  capacity: string;
  class_teacher_id: string;
  room_number: string;
  info: string;
}

export type FieldErrors = Record<string, string>;

export interface ClassFormBaseProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  form: ClassFormState;
  errors: FieldErrors;
  apiError: string | null;
  isSaving: boolean;
  coreClassOpts: { value: string; label: string }[];
  coreLoading: boolean;
  teacherOpts: { value: string; label: string }[];
  updateField: (field: string, value: string) => void;
  blurValidate: (field: string) => void;
  onSubmit: () => void;
  onDismissError: () => void;
  /** If true, class master dropdown is disabled (edit mode) */
  classMasterDisabled?: boolean;
  /** Extra content rendered after the form (e.g. DeletedDuplicateModal) */
  children?: React.ReactNode;
}

export function ClassFormBase({
  title,
  subtitle,
  submitLabel,
  form,
  errors,
  apiError,
  isSaving,
  coreClassOpts,
  coreLoading,
  teacherOpts,
  updateField,
  blurValidate,
  onSubmit,
  onDismissError,
  classMasterDisabled = false,
  children,
}: ClassFormBaseProps) {
  const navigation = useNavigation<SharedStackNavigation>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{title}</Text>
              <Text style={headerStyles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.spacer} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={styles.flex1}
      >
        <FormError message={apiError} onDismiss={onDismissError} />

        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Class Information" icon="🏫">
            <FormDropdown
              label="Class (Master)"
              required
              options={coreClassOpts}
              value={form.class_master}
              onChange={
                classMasterDisabled
                  ? () => undefined
                  : v => updateField('class_master', v)
              }
              error={errors.class_master}
              placeholder="Select class"
              searchable
              loading={coreLoading}
              disabled={classMasterDisabled}
            />
            <FormInput
              label="Section Name"
              required
              value={form.name}
              onChangeText={v => updateField('name', v)}
              onBlurValidate={() => blurValidate('name')}
              error={errors.name}
              placeholder="e.g. A, B, Nehru"
            />
            <FormInput
              label="Capacity"
              value={form.capacity}
              onChangeText={v => updateField('capacity', v)}
              onBlurValidate={() => blurValidate('capacity')}
              error={errors.capacity}
              placeholder="e.g. 50"
              keyboardType="numeric"
              maxLength={3}
            />
            <FormDropdown
              label="Class Teacher"
              options={teacherOpts}
              value={form.class_teacher_id}
              onChange={v => updateField('class_teacher_id', v)}
              placeholder="Select class teacher"
              searchable
            />
            <FormInput
              label="Room Number"
              value={form.room_number}
              onChangeText={v => updateField('room_number', v)}
              placeholder="e.g. Room 101"
            />
            <FormInput
              label="Description"
              value={form.info}
              onChangeText={v => updateField('info', v)}
              placeholder="Optional notes about this class"
              multiline
              numberOfLines={3}
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

export const classFormStyles = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40 },
  flex1: { flex: 1 },
  spacer: { width: 40 },
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

const styles = classFormStyles;
