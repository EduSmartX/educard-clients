/**
 * StudentFormBase - Shared form UI for Create and Edit Student screens.
 * Photo handling differs per screen, injected via slots:
 * - basicInfoPhotoSlot: create's FormPhotoUpload (upload deferred to after create)
 * - topPhotoSlot: edit's ProfileAvatar (immediate upload via useProfileImage)
 * Create-only decorations (teacher banners, class hint) are also injected via slots.
 */

import { GENDER_OPTIONS } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { ReactNode, RefObject } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FormInput,
  FormPhoneInput,
  FormSelect,
  FormSection,
  FormError,
  FormDropdown,
  FormDatePicker,
} from '@/components/forms';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

export interface StudentFormState {
  class_id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  email: string;
  phone: string;
  gender: string;
  blood_group: string;
  date_of_birth: string;
  admission_number: string;
  admission_date: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_relationship: string;
  medical_conditions: string;
  description: string;
  previous_school_name: string;
  previous_school_class: string;
  previous_school_address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export type FieldErrors = Record<string, string>;
type Option = { value: string; label: string };

const GRADIENT = ['#7c3aed', '#4f46e5'] as const;
const NOOP = () => undefined;

export interface StudentFormBaseProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  submitting: boolean;
  form: StudentFormState;
  errors: FieldErrors;
  apiError: string | null;
  onDismissError: () => void;
  classOptions: Option[];
  bloodGroupOpts: Option[];
  relationOpts: Option[];
  updateField: (field: string, value: string) => void;
  blurValidate: (field: string) => void;
  onSubmit: () => void;
  quickAdd: boolean;
  /** When provided, a "Quick Add" toggle is shown (create only). */
  onQuickAddChange?: (v: boolean) => void;
  /** Whether the class dropdown is editable (create) or locked (edit). */
  classEditable: boolean;
  /** Whether student fields are editable (create gates on class selection; edit always true). */
  fieldsEditable: boolean;
  addressExpanded: boolean;
  onToggleAddress: () => void;
  prevSchoolExpanded: boolean;
  onTogglePrevSchool: () => void;
  scrollRef?: RefObject<KeyboardAwareScrollView | null>;
  /** Photo control rendered at the very top (edit's ProfileAvatar). */
  topPhotoSlot?: ReactNode;
  /** Photo control rendered as the first Basic Info field (create's FormPhotoUpload). */
  basicInfoPhotoSlot?: ReactNode;
  /** Teacher info/warning banners (create only), rendered after the quick-add toggle. */
  bannersSlot?: ReactNode;
  /** Class-selection hint (create only), rendered after the Class Assignment section. */
  classHintSlot?: ReactNode;
  /** Extra content after the form (e.g. DeletedDuplicateModal). */
  children?: ReactNode;
}

function genderOptionsWithIcons(): Option[] {
  return GENDER_OPTIONS.map(g => {
    let icon = '🧑';
    if (g.value === 'M') icon = '👨';
    else if (g.value === 'F') icon = '👩';
    return { value: g.value, label: `${icon} ${g.label}` };
  });
}

export function StudentFormBase({
  title,
  subtitle,
  submitLabel,
  submitting,
  form,
  errors,
  apiError,
  onDismissError,
  classOptions,
  bloodGroupOpts,
  relationOpts,
  updateField,
  blurValidate,
  onSubmit,
  quickAdd,
  onQuickAddChange,
  classEditable,
  fieldsEditable,
  addressExpanded,
  onToggleAddress,
  prevSchoolExpanded,
  onTogglePrevSchool,
  scrollRef,
  topPhotoSlot,
  basicInfoPhotoSlot,
  bannersSlot,
  classHintSlot,
  children,
}: StudentFormBaseProps) {
  const navigation = useNavigation<SharedStackNavigation>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={GRADIENT} style={headerStyles.header}>
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
              <Text style={headerStyles.title}>{title}</Text>
              <Text style={headerStyles.subtitle}>{subtitle}</Text>
            </View>
            <View style={s.spacer} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={s.flex1}
        contentContainerStyle={s.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={120}
        extraHeight={150}
      >
        {topPhotoSlot}

        <FormError message={apiError} onDismiss={onDismissError} />

        {onQuickAddChange && (
          <Animated.View entering={FadeInDown.delay(50)}>
            <View style={s.toggle}>
              <Text style={s.toggleLabel}>
                Quick Add (Only Required Fields)
              </Text>
              <Switch
                value={quickAdd}
                onValueChange={onQuickAddChange}
                trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                thumbColor={quickAdd ? '#7c3aed' : '#94a3b8'}
              />
            </View>
          </Animated.View>
        )}

        {bannersSlot}

        <Animated.View entering={FadeInDown.delay(80)}>
          <FormSection title="Class Assignment" icon="🏫">
            <FormDropdown
              label="Class"
              required
              options={classOptions}
              value={form.class_id}
              onChange={classEditable ? v => updateField('class_id', v) : NOOP}
              error={errors.class_id}
              placeholder="Select a class"
              searchable
              disabled={!classEditable}
            />
          </FormSection>
        </Animated.View>

        {classHintSlot}

        <Animated.View entering={FadeInDown.delay(120)}>
          <FormSection title="Basic Information" icon="👤">
            {basicInfoPhotoSlot}
            <FormInput
              label="First Name"
              required
              value={form.first_name}
              onChangeText={v => updateField('first_name', v)}
              onBlurValidate={() => blurValidate('first_name')}
              error={errors.first_name}
              placeholder="Enter first name"
              editable={fieldsEditable}
            />
            <FormInput
              label="Last Name"
              required
              value={form.last_name}
              onChangeText={v => updateField('last_name', v)}
              onBlurValidate={() => blurValidate('last_name')}
              error={errors.last_name}
              placeholder="Enter last name"
              editable={fieldsEditable}
            />
            <FormInput
              label="Roll Number"
              required
              value={form.roll_number}
              onChangeText={v => updateField('roll_number', v)}
              onBlurValidate={() => blurValidate('roll_number')}
              error={errors.roll_number}
              placeholder="Enter roll number"
              editable={fieldsEditable}
            />
            <FormInput
              label="Email"
              value={form.email}
              onChangeText={v => updateField('email', v)}
              onBlurValidate={() => blurValidate('email')}
              error={errors.email}
              placeholder="Enter email"
              keyboardType="email-address"
              editable={fieldsEditable}
            />
            <FormPhoneInput
              label="Phone"
              value={form.phone}
              onChangeText={v => updateField('phone', v)}
              onBlurValidate={() => blurValidate('phone')}
              error={errors.phone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
              editable={fieldsEditable}
              hint="10-digit mobile number"
            />
            <FormSelect
              label="Gender"
              options={genderOptionsWithIcons()}
              value={form.gender}
              onChange={v => updateField('gender', v)}
              required
              error={errors.gender}
            />
            {!quickAdd && (
              <>
                <FormDropdown
                  label="Blood Group"
                  options={bloodGroupOpts}
                  value={form.blood_group}
                  onChange={v => updateField('blood_group', v)}
                  placeholder="Select blood group"
                  disabled={!fieldsEditable}
                />
                <FormDatePicker
                  label="Date of Birth"
                  value={form.date_of_birth}
                  onChange={v => updateField('date_of_birth', v)}
                  disabled={!fieldsEditable}
                />
              </>
            )}
          </FormSection>
        </Animated.View>

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(180)}>
            <FormSection title="Admission Information" icon="🎓">
              <FormInput
                label="Admission Number"
                value={form.admission_number}
                onChangeText={v => updateField('admission_number', v)}
                placeholder="Enter admission number"
                editable={fieldsEditable}
              />
              <FormDatePicker
                label="Admission Date"
                value={form.admission_date}
                onChange={v => updateField('admission_date', v)}
                disabled={!fieldsEditable}
              />
            </FormSection>
          </Animated.View>
        )}

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(240)}>
            <FormSection title="Guardian Information" icon="👨‍👩‍👦">
              <FormInput
                label="Guardian Name"
                value={form.guardian_name}
                onChangeText={v => updateField('guardian_name', v)}
                placeholder="Enter guardian name"
                editable={fieldsEditable}
              />
              <FormPhoneInput
                label="Guardian Phone"
                value={form.guardian_phone}
                onChangeText={v => updateField('guardian_phone', v)}
                onBlurValidate={() => blurValidate('guardian_phone')}
                error={errors.guardian_phone}
                placeholder="Enter guardian phone"
                keyboardType="phone-pad"
                maxLength={15}
                editable={fieldsEditable}
              />
              <FormInput
                label="Guardian Email"
                value={form.guardian_email}
                onChangeText={v => updateField('guardian_email', v)}
                onBlurValidate={() => blurValidate('guardian_email')}
                error={errors.guardian_email}
                placeholder="Enter guardian email"
                keyboardType="email-address"
                editable={fieldsEditable}
              />
              <FormDropdown
                label="Relationship"
                options={relationOpts}
                value={form.guardian_relationship}
                onChange={v => updateField('guardian_relationship', v)}
                placeholder="Select relationship"
                disabled={!fieldsEditable}
              />
            </FormSection>
          </Animated.View>
        )}

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <FormSection title="Medical & Additional" icon="🏥">
              <FormInput
                label="Medical Conditions"
                value={form.medical_conditions}
                onChangeText={v => updateField('medical_conditions', v)}
                placeholder="Any medical conditions or allergies"
                multiline
                numberOfLines={3}
                editable={fieldsEditable}
              />
              <FormInput
                label="Description"
                value={form.description}
                onChangeText={v => updateField('description', v)}
                placeholder="Additional notes"
                multiline
                numberOfLines={3}
                editable={fieldsEditable}
              />
            </FormSection>
          </Animated.View>
        )}

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(380)}>
            <TouchableOpacity
              style={s.collapseHead}
              onPress={onTogglePrevSchool}
              activeOpacity={0.7}
            >
              <Text style={s.collapseTitle}>
                🏫 Previous School <Text style={s.optText}>(Optional)</Text>
              </Text>
              {prevSchoolExpanded ? (
                <ChevronUp size={20} color="#64748b" />
              ) : (
                <ChevronDown size={20} color="#64748b" />
              )}
            </TouchableOpacity>
            {prevSchoolExpanded && (
              <View style={s.collapseBody}>
                <FormInput
                  label="Previous School Name"
                  value={form.previous_school_name}
                  onChangeText={v => updateField('previous_school_name', v)}
                  placeholder="Enter previous school name"
                />
                <FormInput
                  label="Previous School Class"
                  value={form.previous_school_class}
                  onChangeText={v => updateField('previous_school_class', v)}
                  placeholder="Enter previous class"
                />
                <FormInput
                  label="Previous School Address"
                  value={form.previous_school_address}
                  onChangeText={v => updateField('previous_school_address', v)}
                  placeholder="Enter school address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </Animated.View>
        )}

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(420)}>
            <TouchableOpacity
              style={s.collapseHead}
              onPress={onToggleAddress}
              activeOpacity={0.7}
            >
              <Text style={s.collapseTitle}>
                📍 Address <Text style={s.optText}>(Optional)</Text>
              </Text>
              {addressExpanded ? (
                <ChevronUp size={20} color="#64748b" />
              ) : (
                <ChevronDown size={20} color="#64748b" />
              )}
            </TouchableOpacity>
            {addressExpanded && (
              <View style={s.collapseBody}>
                <FormInput
                  label="Street Address"
                  value={form.street_address}
                  onChangeText={v => updateField('street_address', v)}
                  placeholder="Enter street address"
                />
                <FormInput
                  label="City"
                  value={form.city}
                  onChangeText={v => updateField('city', v)}
                  placeholder="Enter city"
                />
                <FormInput
                  label="State"
                  value={form.state}
                  onChangeText={v => updateField('state', v)}
                  placeholder="Enter state"
                />
                <FormInput
                  label="Postal Code"
                  value={form.postal_code}
                  onChangeText={v => updateField('postal_code', v)}
                  placeholder="Enter postal code"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <FormInput
                  label="Country"
                  value={form.country}
                  onChangeText={v => updateField('country', v)}
                  placeholder="Enter country"
                />
              </View>
            )}
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={onSubmit}
          disabled={submitting}
          style={s.submitBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.submitGrad}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={s.submitText}>{submitLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {children}
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  spacer: { width: 40 },
  form: { padding: 16, paddingBottom: 40 },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1e40af' },
  collapseHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 2,
  },
  collapseTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  optText: { fontSize: 13, fontWeight: '400', color: '#94a3b8' },
  collapseBody: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#f0f0f0',
    marginBottom: 14,
  },
  submitBtn: { marginTop: 8 },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
