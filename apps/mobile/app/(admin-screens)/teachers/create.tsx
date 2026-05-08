/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing */ /**
 * Create Teacher Screen — Uses shared Zod validation schemas
 * Validates on blur (per-field) and on submit (full form)
 */

import {
  getRoleGradient,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  teacherQuickSchema,
  teacherFullSchema,
  validateField,
  validateAllFields,
  buildTeacherPayload,
  parseApiErrors,
  getErrorMessage,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import {
  FormInput,
  FormSelect,
  FormSection,
  FormError,
  FormDropdown,
  FormDatePicker,
  FormPhotoUpload,
} from '@/components/forms';
import { FormMultiSelect } from '@/components/forms/FormMultiSelect';
import { useRoleTypes, useSupervisors, useCoreSubjects, uploadProfilePhoto } from '@/features/core';
import { useCreateTeacher, useRestoreTeacher } from '@/features/teachers';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { headerStyles, layoutStyles } from '@/styles';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function CreateTeacherScreen() {
  const router = useRouter();
  const createMutation = useCreateTeacher();
  const restoreMutation = useRestoreTeacher();
  const scrollRef = useRef<ScrollView>(null);
  const { data: roleTypes, isLoading: rolesLoading } = useRoleTypes();
  const { data: supervisors, isLoading: supervisorsLoading } = useSupervisors();
  const { data: coreSubjects } = useCoreSubjects();

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: any;
    deletedRecordId: string | null;
  }>();

  const [quickAdd, setQuickAdd] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAsset, setPhotoAsset] = useState<any>(null);

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
    emergency_contact_name: '',
    emergency_contact_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const schema = quickAdd ? teacherQuickSchema : teacherFullSchema;

  const roleOptions = useMemo(
    () => (roleTypes || []).map((r) => ({ value: r.id.toString(), label: r.name })),
    [roleTypes]
  );
  const supervisorOptions = useMemo(
    () =>
      (supervisors || []).map((s) => ({ value: s.email, label: `${s.full_name} (${s.email})` })),
    [supervisors]
  );
  const bloodGroupOpts = BLOOD_GROUP_OPTIONS.map((b) => ({ value: b.value, label: b.label }));
  const subjectOptions = useMemo(
    () => (coreSubjects || []).map((s: any) => ({ value: s.id.toString(), label: s.name })),
    [coreSubjects]
  );

  const updateField = useCallback(
    (field: string, value: any) => {
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
      const err = validateField(schema, field, typeof val === 'string' ? val : '');
      setErrors((prev) => {
        if (err) return { ...prev, [field]: err };
        const n = { ...prev };
        delete n[field];
        return n;
      });
    },
    [form, schema]
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fieldErrors = validateAllFields(schema, form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const payload = buildTeacherPayload(form, quickAdd);
    if (!quickAdd && form.subjects.length > 0) {
      payload.subjects = form.subjects.map(Number);
    }
    submitCreate(payload, false);
  }, [form, quickAdd, schema]);

  const submitCreate = useCallback(
    (payload: any, forceCreate: boolean) => {
      createMutation.mutate(
        { data: payload, forceCreate },
        {
          onSuccess: (response: any) => {
            duplicateHandler.closeDialog();
            const uid = response?.data?.user?.public_id || response?.user?.public_id;
            if (photoUri && uid) uploadProfilePhoto(uid, photoUri, 'photo.jpg').catch(() => {});
            Alert.alert('✅ Success', 'Teacher created successfully!', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
          onError: (err: any) => {
            // Check for deleted duplicate error
            if (isDeletedDuplicateError(err)) {
              const msg = getDeletedDuplicateMessage(err);
              const recordId = getDeletedRecordId(err);
              duplicateHandler.openDialog(msg, { payload, deletedRecordId: recordId });
              return;
            }

            if (err?.response?.data) {
              const { fieldErrors: fe, generalError } = parseApiErrors(err.response.data);
              if (Object.keys(fe).length > 0) {
                setErrors(fe);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                return;
              }
              setApiError(generalError || 'Failed to create teacher.');
            } else {
              setApiError(
                err?.message || 'Network error. Please check your connection and try again.'
              );
            }
          },
        }
      );
    },
    [createMutation, router, photoUri, duplicateHandler]
  );

  const handleReactivate = useCallback(() => {
    const recordId = duplicateHandler.pendingData?.deletedRecordId;
    if (!recordId) {
      Alert.alert('Error', 'Could not find deleted record ID.');
      return;
    }
    restoreMutation.mutate(recordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        Alert.alert('✅ Restored', 'The deleted teacher has been reactivated successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (error: unknown) => {
        Alert.alert(
          'Error',
          getErrorMessage(error, 'Failed to reactivate the teacher. Please try again.')
        );
      },
    });
  }, [duplicateHandler, restoreMutation, router]);

  const handleForceCreate = useCallback(() => {
    const payload = duplicateHandler.pendingData?.payload;
    if (payload) {
      duplicateHandler.closeDialog();
      submitCreate(payload, true);
    }
  }, [duplicateHandler, submitCreate]);

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Add New Teacher</Text>
              <Text style={headerStyles.subtitle}>Add a new teacher to your organization</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

          <Animated.View entering={FadeInDown.delay(50)}>
            <View style={s.toggle}>
              <Text style={s.toggleLabel}>Quick Add (Only Required Fields)</Text>
              <Switch
                value={quickAdd}
                onValueChange={setQuickAdd}
                trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                thumbColor={quickAdd ? '#7c3aed' : '#94a3b8'}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)}>
            <FormSection title="Basic Information" icon="👤">
              <FormPhotoUpload
                imageUri={photoUri}
                onImageSelected={(uri, asset) => {
                  setPhotoUri(uri);
                  setPhotoAsset(asset);
                }}
                name={`${form.first_name} ${form.last_name}`.trim()}
                gender={form.gender}
              />
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
                options={GENDER_OPTIONS.map((g) => ({
                  value: g.value,
                  label: `${g.value === 'M' ? '👨' : g.value === 'F' ? '👩' : '🧑'} ${g.label}`,
                }))}
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
              {!quickAdd && (
                <>
                  <FormInput
                    label="Phone"
                    value={form.phone}
                    onChangeText={(v) => updateField('phone', v)}
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
                    onChange={(v) => updateField('blood_group', v)}
                    placeholder="Select blood group"
                  />
                  <FormDatePicker
                    label="Date of Birth"
                    value={form.date_of_birth}
                    onChange={(v) => updateField('date_of_birth', v)}
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
                  error={errors.supervisor_email}
                  placeholder="Select supervisor"
                  searchable
                  loading={supervisorsLoading}
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
          )}

          {!quickAdd && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <FormSection title="Emergency Contact" icon="🆘">
                <FormInput
                  label="Emergency Contact Name"
                  value={form.emergency_contact_name}
                  onChangeText={(v) => updateField('emergency_contact_name', v)}
                  placeholder="Enter contact name"
                />
                <FormInput
                  label="Emergency Contact Phone"
                  value={form.emergency_contact_number}
                  onChangeText={(v) => updateField('emergency_contact_number', v)}
                  onBlurValidate={() => blurValidate('emergency_contact_number')}
                  error={errors.emergency_contact_number}
                  placeholder="Enter contact phone"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </FormSection>
            </Animated.View>
          )}

          {!quickAdd && (
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
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            style={s.submitBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.submitGrad}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={s.submitText}>Create Teacher</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Deleted Duplicate Modal */}
      <DeletedDuplicateModal
        visible={duplicateHandler.isOpen}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
        isLoading={restoreMutation.isPending || createMutation.isPending}
      />
    </View>
  );
}

const s = StyleSheet.create({
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
