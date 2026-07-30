/**
 * TeacherFormBase - Shared form UI for Create and Edit Teacher screens.
 * Photo handling differs per screen, so it is injected via slots:
 * - basicInfoPhotoSlot: create's FormPhotoUpload (upload deferred to after create)
 * - topPhotoSlot: edit's ProfileAvatar (immediate upload via useProfileImage)
 */

import { GENDER_OPTIONS, ADDRESS_TYPE_OPTIONS } from '@educard/shared';
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
  FormMultiSelect,
} from '@/components/forms';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

export interface TeacherFormState {
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  organization_role: string;
  phone: string;
  blood_group: string;
  date_of_birth: string;
  designation: string;
  highest_qualification: string;
  specialization: string;
  experience_years: string;
  joining_date: string;
  supervisor_email: string;
  subjects: string[];
  address_type: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export type FieldErrors = Record<string, string>;
type Option = { value: string; label: string };

const GRADIENT = ['#7c3aed', '#4f46e5'] as const;

export interface TeacherFormBaseProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  submitting: boolean;
  form: TeacherFormState;
  errors: FieldErrors;
  apiError: string | null;
  onDismissError: () => void;
  roleOptions: Option[];
  rolesLoading: boolean;
  supervisorOptions: Option[];
  supervisorsLoading: boolean;
  bloodGroupOpts: Option[];
  subjectOptions: Option[];
  updateField: (field: string, value: string | string[]) => void;
  blurValidate: (field: string) => void;
  onSubmit: () => void;
  quickAdd: boolean;
  /** When provided, a "Quick Add" toggle is shown (create only). */
  onQuickAddChange?: (v: boolean) => void;
  addressExpanded: boolean;
  onToggleAddress: () => void;
  scrollRef?: RefObject<KeyboardAwareScrollView | null>;
  /** Photo control rendered at the very top (edit's ProfileAvatar). */
  topPhotoSlot?: ReactNode;
  /** Photo control rendered as the first Basic Info field (create's FormPhotoUpload). */
  basicInfoPhotoSlot?: ReactNode;
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

export function TeacherFormBase({
  title,
  subtitle,
  submitLabel,
  submitting,
  form,
  errors,
  apiError,
  onDismissError,
  roleOptions,
  rolesLoading,
  supervisorOptions,
  supervisorsLoading,
  bloodGroupOpts,
  subjectOptions,
  updateField,
  blurValidate,
  onSubmit,
  quickAdd,
  onQuickAddChange,
  addressExpanded,
  onToggleAddress,
  scrollRef,
  topPhotoSlot,
  basicInfoPhotoSlot,
  children,
}: TeacherFormBaseProps) {
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

        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Basic Information" icon="👤">
            {basicInfoPhotoSlot}
            <FormInput
              label="Employee ID"
              required
              value={form.employee_id}
              onChangeText={v => updateField('employee_id', v)}
              onBlurValidate={() => blurValidate('employee_id')}
              error={errors.employee_id}
              placeholder="Enter employee ID"
            />
            <FormInput
              label="Email"
              required
              value={form.email}
              onChangeText={v => updateField('email', v)}
              onBlurValidate={() => blurValidate('email')}
              error={errors.email}
              placeholder="Enter email"
              keyboardType="email-address"
            />
            <FormInput
              label="First Name"
              required
              value={form.first_name}
              onChangeText={v => updateField('first_name', v)}
              onBlurValidate={() => blurValidate('first_name')}
              error={errors.first_name}
              placeholder="Enter first name"
            />
            <FormInput
              label="Last Name"
              required
              value={form.last_name}
              onChangeText={v => updateField('last_name', v)}
              onBlurValidate={() => blurValidate('last_name')}
              error={errors.last_name}
              placeholder="Enter last name"
            />
            <FormSelect
              label="Gender"
              required
              options={genderOptionsWithIcons()}
              value={form.gender}
              onChange={v => updateField('gender', v)}
              error={errors.gender}
            />
            <FormDropdown
              label="Organization Role"
              required
              options={roleOptions}
              value={form.organization_role}
              onChange={v => updateField('organization_role', v)}
              error={errors.organization_role}
              placeholder="Select organization role"
              searchable
              loading={rolesLoading}
            />
            {!quickAdd && (
              <>
                <FormPhoneInput
                  label="Phone"
                  value={form.phone}
                  onChangeText={v => updateField('phone', v)}
                  onBlurValidate={() => blurValidate('phone')}
                  error={errors.phone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  hint="10-digit mobile number"
                />
                <FormDropdown
                  label="Blood Group"
                  options={bloodGroupOpts}
                  value={form.blood_group}
                  onChange={v => updateField('blood_group', v)}
                  placeholder="Select blood group"
                />
                <FormDatePicker
                  label="Date of Birth"
                  value={form.date_of_birth}
                  onChange={v => updateField('date_of_birth', v)}
                />
              </>
            )}
          </FormSection>
        </Animated.View>

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <FormSection title="Professional Details" icon="💼">
              <FormInput
                label="Designation"
                value={form.designation}
                onChangeText={v => updateField('designation', v)}
                placeholder="e.g. Senior Teacher"
              />
              <FormInput
                label="Qualification"
                value={form.highest_qualification}
                onChangeText={v => updateField('highest_qualification', v)}
                placeholder="e.g. M.Ed, B.Sc"
              />
              <FormInput
                label="Specialization"
                value={form.specialization}
                onChangeText={v => updateField('specialization', v)}
                placeholder="e.g. Mathematics, Science"
              />
              <FormInput
                label="Experience (Years)"
                value={form.experience_years}
                onChangeText={v => updateField('experience_years', v)}
                onBlurValidate={() => blurValidate('experience_years')}
                error={errors.experience_years}
                placeholder="Years of experience"
                keyboardType="numeric"
                maxLength={2}
              />
              <FormDropdown
                label="Supervisor"
                options={supervisorOptions}
                value={form.supervisor_email}
                onChange={v => updateField('supervisor_email', v)}
                error={errors.supervisor_email}
                placeholder="Select supervisor"
                searchable
                loading={supervisorsLoading}
              />
              <FormMultiSelect
                label="Subjects to Teach"
                options={subjectOptions}
                value={form.subjects}
                onChange={v => updateField('subjects', v)}
                placeholder="Select subjects..."
                searchable
              />
              <FormDatePicker
                label="Date of Joining"
                value={form.joining_date}
                onChange={v => updateField('joining_date', v)}
              />
            </FormSection>
          </Animated.View>
        )}

        {!quickAdd && (
          <Animated.View entering={FadeInDown.delay(400)}>
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
                <FormDropdown
                  label="Address Type"
                  options={ADDRESS_TYPE_OPTIONS.map(o => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={form.address_type}
                  onChange={v => updateField('address_type', v)}
                  placeholder="Select address type"
                />
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
