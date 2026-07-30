/**
 * Edit Teacher Screen
 * Fetches existing teacher data, pre-populates form, PATCHes on save.
 * Receives ?id=<publicId> via query param.
 */

import {
  getRoleGradient,
  ADDRESS_TYPE,
  ADDRESS_TYPE_OPTIONS,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  teacherFullSchema,
  validateField,
  validateAllFields,
  buildTeacherPayload,
  parseApiErrors,
  type CreateTeacherPayload,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import {
  FormInput,
  FormSelect,
  FormSection,
  FormError,
  FormDropdown,
  FormDatePicker,
} from '@/components/forms';
import { FormMultiSelect } from '@/components/forms/FormMultiSelect';
import { useRoleTypes, useSupervisors, useCoreSubjects } from '@/features/core';
import { useTeacherDetail, useUpdateTeacher, teacherKeys } from '@/features/teachers';
import { useProfileImage } from '@/hooks/useProfileImage';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function EditTeacherScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: teacher, isLoading: detailLoading, dataUpdatedAt } = useTeacherDetail(id || '');
  const updateMutation = useUpdateTeacher();
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const { data: roleTypes, isLoading: rolesLoading } = useRoleTypes();
  const { data: supervisors, isLoading: supervisorsLoading } = useSupervisors();
  const { data: coreSubjects } = useCoreSubjects();

  const [addressExpanded, setAddressExpanded] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  const {
    pickAndUpload,
    isUploading: isPhotoUploading,
    localUri: localPhotoUri,
  } = useProfileImage({
    userPublicId: teacher?.user?.public_id,
    onSuccess: () => {
      // photo updated — queries will be invalidated automatically
    },
    // Invalidate teacher detail query when photo is updated
    additionalInvalidateKeys: id ? [teacherKeys.detail(id)] : undefined,
  });

  const [form, setForm] = useState({
    employee_id: '',
    email: '',
    first_name: '',
    last_name: '',
    gender: '',
    organization_role: '',
    phone: '',
    blood_group: '',
    date_of_birth: '',
    designation: '',
    highest_qualification: '',
    specialization: '',
    experience_years: '',
    joining_date: '',
    supervisor_email: '',
    subjects: [] as string[],
    address_type: ADDRESS_TYPE.USER_CURRENT as string,
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Pre-populate form when teacher data loads
  useEffect(() => {
    if (teacher && !formLoaded) {
      const u = teacher.user;
      const addr = u?.address;
      setForm({
        employee_id: teacher.employee_id ?? '',
        email: u?.email ?? '',
        first_name: u?.first_name ?? '',
        last_name: u?.last_name ?? '',
        gender: u?.gender ?? '',
        organization_role: u?.organization_role?.id?.toString() ?? '',
        phone: u?.phone ?? '',
        blood_group: u?.blood_group ?? '',
        date_of_birth: u?.date_of_birth ?? '',
        designation: teacher.designation ?? '',
        highest_qualification: teacher.highest_qualification ?? '',
        specialization: teacher.specialization ?? '',
        experience_years: teacher.experience_years?.toString() ?? '',
        joining_date: teacher.joining_date ?? '',
        supervisor_email: u?.supervisor?.email ?? '',
        subjects: (teacher.subjects ?? []).map((s) => s.id?.toString() ?? s.public_id),
        address_type: addr?.address_type ?? ADDRESS_TYPE.USER_CURRENT,
        street_address: addr?.street_address ?? '',
        city: addr?.city ?? '',
        state: addr?.state ?? '',
        postal_code: addr?.zip_code ?? '',
        country: addr?.country ?? '',
      });
      setFormLoaded(true);
    }
  }, [teacher, formLoaded]);

  const roleOptions = useMemo(
    () => (roleTypes ?? []).map((r) => ({ value: r.id.toString(), label: r.name })),
    [roleTypes]
  );
  const supervisorOptions = useMemo(
    () =>
      (supervisors ?? [])
        .filter((s) => s.email !== form.email)
        .map((s) => ({ value: s.email, label: `${s.full_name} (${s.email})` })),
    [supervisors, form.email]
  );
  const bloodGroupOpts = BLOOD_GROUP_OPTIONS.map((b) => ({ value: b.value, label: b.label }));
  const subjectOptions = useMemo(
    () => (coreSubjects ?? []).map((s) => ({ value: s.id.toString(), label: s.name })),
    [coreSubjects]
  );

  const updateField = useCallback(
    (field: string, value: string | string[]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field])
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
    },
    [errors]
  );

  const blurValidate = useCallback(
    (field: string) => {
      const val = form[field as keyof typeof form];
      const err = validateField(teacherFullSchema, field, typeof val === 'string' ? val : '');
      setErrors((prev) => {
        if (err) return { ...prev, [field]: err };
        const n = { ...prev };
        delete n[field];
        return n;
      });
    },
    [form]
  );

  const handleSubmit = useCallback(() => {
    if (updateMutation.isPending) return; // Prevent double-tap
    setApiError(null);
    const fieldErrors = validateAllFields(teacherFullSchema, form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      scrollRef.current?.scrollToPosition(0, 0, true);
      return;
    }

    const payload = buildTeacherPayload(form, false) as Partial<CreateTeacherPayload> & {
      // NOSONAR
      subjects?: number[];
    };
    if (form.subjects.length > 0) {
      payload.subjects = form.subjects.map(Number);
    }
    void updateMutation.mutate(
      { publicId: id ?? '', data: payload },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: Record<string, unknown> }; message?: string };
          if (apiErr.response?.data) {
            const { fieldErrors: fe, generalError } = parseApiErrors(apiErr.response.data);
            if (Object.keys(fe).length > 0) {
              setErrors(fe);
              scrollRef.current?.scrollToPosition(0, 0, true);
              return;
            }
            setApiError(generalError ?? 'Failed to update teacher.');
          } else {
            setApiError(apiErr.message ?? 'Network error.');
          }
        },
      }
    );
  }, [form, id, updateMutation, router]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading teacher data...</Text>
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Edit Teacher</Text>
              <Text style={headerStyles.subtitle}>
                {form.first_name} {form.last_name}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={120}
        extraHeight={150}
      >
        {/* Profile Avatar */}
        <Animated.View
          entering={FadeIn.delay(150)}
          style={{ alignItems: 'center', marginBottom: 16 }}
        >
          <ProfileAvatar
            name={`${form.first_name} ${form.last_name}`.trim()}
            imageUri={localPhotoUri ?? teacher?.profile_photo_thumbnail}
            size={90}
            onPress={pickAndUpload}
            isUploading={isPhotoUploading}
            cacheVersion={dataUpdatedAt}
          />
          <Text style={{ marginTop: 8, fontSize: 18, fontWeight: '700', color: '#1e293b' }}>
            {form.first_name} {form.last_name}
          </Text>
        </Animated.View>

        <FormError message={apiError} onDismiss={() => setApiError(null)} />

        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Basic Information" icon="👤">
            <FormInput
              label="Employee ID"
              required
              value={form.employee_id}
              onChangeText={(v) => updateField('employee_id', v)}
              onBlurValidate={() => blurValidate('employee_id')}
              error={errors.employee_id}
              placeholder="Enter employee ID"
            />
            <FormInput
              label="Email"
              required
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              onBlurValidate={() => blurValidate('email')}
              error={errors.email}
              placeholder="Enter email"
              keyboardType="email-address"
            />
            <FormInput
              label="First Name"
              required
              value={form.first_name}
              onChangeText={(v) => updateField('first_name', v)}
              onBlurValidate={() => blurValidate('first_name')}
              error={errors.first_name}
              placeholder="Enter first name"
            />
            <FormInput
              label="Last Name"
              required
              value={form.last_name}
              onChangeText={(v) => updateField('last_name', v)}
              onBlurValidate={() => blurValidate('last_name')}
              error={errors.last_name}
              placeholder="Enter last name"
            />
            <FormSelect
              label="Gender"
              required
              options={GENDER_OPTIONS.map((g) => {
                let icon = '🧑';
                if (g.value === 'M') icon = '👨';
                else if (g.value === 'F') icon = '👩';
                return { value: g.value, label: `${icon} ${g.label}` };
              })}
              value={form.gender}
              onChange={(v) => updateField('gender', v)}
              error={errors.gender}
            />
            <FormDropdown
              label="Organization Role"
              required
              options={roleOptions}
              value={form.organization_role}
              onChange={(v) => updateField('organization_role', v)}
              error={errors.organization_role}
              placeholder="Select organization role"
              searchable
              loading={rolesLoading}
            />
            <FormInput
              label="Phone"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              onBlurValidate={() => blurValidate('phone')}
              error={errors.phone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <FormDropdown
              label="Blood Group"
              options={bloodGroupOpts}
              value={form.blood_group}
              onChange={(v) => updateField('blood_group', v)}
              placeholder="Select blood group"
            />
            <FormDatePicker
              label="Date of Birth"
              value={form.date_of_birth}
              onChange={(v) => updateField('date_of_birth', v)}
            />
          </FormSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <FormSection title="Professional Details" icon="💼">
            <FormInput
              label="Designation"
              value={form.designation}
              onChangeText={(v) => updateField('designation', v)}
              placeholder="e.g. Senior Teacher"
            />
            <FormInput
              label="Qualification"
              value={form.highest_qualification}
              onChangeText={(v) => updateField('highest_qualification', v)}
              placeholder="e.g. M.Ed, B.Sc"
            />
            <FormInput
              label="Specialization"
              value={form.specialization}
              onChangeText={(v) => updateField('specialization', v)}
              placeholder="e.g. Mathematics, Science"
            />
            <FormInput
              label="Experience (Years)"
              value={form.experience_years}
              onChangeText={(v) => updateField('experience_years', v)}
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
              onChange={(v) => updateField('supervisor_email', v)}
              placeholder="Select supervisor"
              searchable
              loading={supervisorsLoading}
              error={errors.supervisor_email}
            />

            {/* Subjects Multi-Select */}
            <FormMultiSelect
              label="Subjects to Teach"
              options={subjectOptions}
              value={form.subjects}
              onChange={(v) => updateField('subjects', v)}
              placeholder="Select subjects..."
              searchable
            />

            <FormDatePicker
              label="Date of Joining"
              value={form.joining_date}
              onChange={(v) => updateField('joining_date', v)}
            />
          </FormSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <TouchableOpacity
            style={s.collapseHead}
            onPress={() => setAddressExpanded(!addressExpanded)}
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
                options={ADDRESS_TYPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                value={form.address_type}
                onChange={(v) => updateField('address_type', v)}
                placeholder="Select address type"
              />
              <FormInput
                label="Street Address"
                value={form.street_address}
                onChangeText={(v) => updateField('street_address', v)}
                placeholder="Enter street address"
              />
              <FormInput
                label="City"
                value={form.city}
                onChangeText={(v) => updateField('city', v)}
                placeholder="Enter city"
              />
              <FormInput
                label="State"
                value={form.state}
                onChangeText={(v) => updateField('state', v)}
                placeholder="Enter state"
              />
              <FormInput
                label="Postal Code"
                value={form.postal_code}
                onChangeText={(v) => updateField('postal_code', v)}
                placeholder="Enter postal code"
                keyboardType="numeric"
                maxLength={6}
              />
              <FormInput
                label="Country"
                value={form.country}
                onChangeText={(v) => updateField('country', v)}
                placeholder="Enter country"
              />
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
          style={s.submitBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.submitGrad}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={s.submitText}>Update Teacher</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40 },
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
