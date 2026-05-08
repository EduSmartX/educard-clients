/**
 * Create Student Screen — Uses shared Zod validation schemas
 * Validates on blur (per-field) and on submit (full form)
 */

import {
  getRoleGradient,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  RELATIONSHIP_OPTIONS,
  studentQuickSchema,
  studentFullSchema,
  validateField,
  validateAllFields,
  buildStudentPayload,
  parseApiErrors,
  getErrorMessage,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
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
import { useManagedClasses } from '@/features/classes';
import { uploadProfilePhoto } from '@/features/core';
import { useCreateStudent, useRestoreStudent } from '@/features/students';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';
import { isTeacherRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function CreateStudentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createMutation = useCreateStudent();
  const restoreMutation = useRestoreStudent();

  // Check if user is a teacher (not admin)
  const isTeacher = isTeacherRole(user?.role);

  // Fetch managed classes - for teachers, only classes where they are class teacher
  const { data: classesData } = useManagedClasses('student');

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: Record<string, unknown>; // Record<string, unknown> instead of any
    deletedRecordId: string | null;
  }>();
  const classOptions = useMemo(() => {
    const items = classesData?.classes ?? []; // ?? instead of ||
    return items.map((c: { public_id: string; class_master?: { name: string }; name: string }) => ({
      value: c.public_id,
      label: `${c.class_master?.name ?? ''} - ${c.name}`.trim(), // ?? instead of ||
    }));
  }, [classesData]);

  const [quickAdd, setQuickAdd] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [prevSchoolExpanded, setPrevSchoolExpanded] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [_photoAsset, setPhotoAsset] = useState<unknown>(null); // prefixed with _ for unused, unknown instead of any

  const [form, setForm] = useState({
    class_id: '',
    first_name: '',
    last_name: '',
    roll_number: '',
    email: '',
    phone: '',
    gender: '',
    blood_group: '',
    date_of_birth: '',
    admission_number: '',
    admission_date: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    medical_conditions: '',
    description: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    previous_school_name: '',
    previous_school_class: '',
    previous_school_address: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const schema = quickAdd ? studentQuickSchema : studentFullSchema;

  const bloodGroupOpts = BLOOD_GROUP_OPTIONS.map((b) => ({ value: b.value, label: b.label }));
  const relationOpts = RELATIONSHIP_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

  const updateField = useCallback(
    (field: string, value: string) => {
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
      const err = validateField(schema, field, form[field as keyof typeof form]);
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
    const fe = validateAllFields(schema, form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildStudentPayload(form, quickAdd);
    submitCreate(payload, false);
  }, [form, quickAdd, schema, createMutation, router, photoUri]);

  const submitCreate = useCallback(
    (payload: any, forceCreate: boolean) => {
      createMutation.mutate(
        { data: payload, forceCreate },
        {
          onSuccess: (response: any) => {
            duplicateHandler.closeDialog();
            const uid = response?.data?.user_info?.public_id || response?.user_info?.public_id;
            if (photoUri && uid) uploadProfilePhoto(uid, photoUri, 'photo.jpg').catch(() => {});
            Alert.alert('Success', 'Student created successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
          onError: (err: any) => {
            if (isDeletedDuplicateError(err)) {
              const msg = getDeletedDuplicateMessage(err);
              const recordId = getDeletedRecordId(err);
              duplicateHandler.openDialog(msg, { payload, deletedRecordId: recordId });
              return;
            }
            const { fieldErrors: afe, generalError } = parseApiErrors(err?.response?.data);
            if (Object.keys(afe).length > 0) {
              setErrors(afe);
              return;
            }
            setApiError(generalError || 'Failed to create student.');
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
        Alert.alert('✅ Restored', 'The deleted student has been reactivated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (error: unknown) => {
        Alert.alert('Error', getErrorMessage(error, 'Failed to reactivate. Please try again.'));
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

  const classSelected = !!form.class_id;

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
              <Text style={headerStyles.title}>Add New Student</Text>
              <Text style={headerStyles.subtitle}>Enroll a new student</Text>
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
          contentContainerStyle={st.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

          <Animated.View entering={FadeInDown.delay(50)}>
            <View style={st.toggle}>
              <Text style={st.toggleLabel}>Quick Add (Only Required Fields)</Text>
              <Switch
                value={quickAdd}
                onValueChange={setQuickAdd}
                trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                thumbColor={quickAdd ? '#7c3aed' : '#94a3b8'}
              />
            </View>
          </Animated.View>

          {/* Info banner for teachers */}
          {isTeacher && (
            <Animated.View entering={FadeInDown.delay(60)}>
              <View style={st.infoBanner}>
                <Text style={st.infoBannerText}>
                  ℹ️ You can add students only for classes where you are assigned as the class
                  teacher.
                </Text>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(80)}>
            <FormSection title="Class Assignment" icon="🏫">
              <FormDropdown
                label="Class"
                required
                options={classOptions}
                value={form.class_id}
                onChange={(v) => updateField('class_id', v)}
                error={errors.class_id}
                placeholder="Select a class"
                searchable
              />
            </FormSection>
          </Animated.View>

          {!classSelected && (
            <View style={st.hint}>
              <Text style={st.hintText}>
                ⚠️ Please select a class to continue filling the student information.
              </Text>
            </View>
          )}

          <Animated.View entering={FadeInDown.delay(120)}>
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
                label="First Name"
                required
                value={form.first_name}
                onChangeText={(v) => updateField('first_name', v)}
                onBlurValidate={() => blurValidate('first_name')}
                error={errors.first_name}
                placeholder="Enter first name"
                editable={classSelected}
              />
              <FormInput
                label="Last Name"
                required
                value={form.last_name}
                onChangeText={(v) => updateField('last_name', v)}
                onBlurValidate={() => blurValidate('last_name')}
                error={errors.last_name}
                placeholder="Enter last name"
                editable={classSelected}
              />
              <FormInput
                label="Roll Number"
                required
                value={form.roll_number}
                onChangeText={(v) => updateField('roll_number', v)}
                onBlurValidate={() => blurValidate('roll_number')}
                error={errors.roll_number}
                placeholder="Enter roll number"
                editable={classSelected}
              />
              <FormInput
                label="Email"
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                onBlurValidate={() => blurValidate('email')}
                error={errors.email}
                placeholder="Enter email"
                keyboardType="email-address"
                editable={classSelected}
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
                editable={classSelected}
                hint="10-digit mobile number"
              />
              <FormSelect
                label="Gender"
                options={GENDER_OPTIONS.map((g) => ({
                  value: g.value,
                  label: `${g.value === 'M' ? '👨' : g.value === 'F' ? '👩' : '🧑'} ${g.label}`,
                }))}
                value={form.gender}
                onChange={(v) => updateField('gender', v)}
              />
              {!quickAdd && (
                <>
                  <FormDropdown
                    label="Blood Group"
                    options={bloodGroupOpts}
                    value={form.blood_group}
                    onChange={(v) => updateField('blood_group', v)}
                    placeholder="Select blood group"
                    disabled={!classSelected}
                  />
                  <FormDatePicker
                    label="Date of Birth"
                    value={form.date_of_birth}
                    onChange={(v) => updateField('date_of_birth', v)}
                    disabled={!classSelected}
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
                  onChangeText={(v) => updateField('admission_number', v)}
                  placeholder="Enter admission number"
                  editable={classSelected}
                />
                <FormDatePicker
                  label="Admission Date"
                  value={form.admission_date}
                  onChange={(v) => updateField('admission_date', v)}
                  disabled={!classSelected}
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
                  onChangeText={(v) => updateField('guardian_name', v)}
                  placeholder="Enter guardian name"
                  editable={classSelected}
                />
                <FormInput
                  label="Guardian Phone"
                  value={form.guardian_phone}
                  onChangeText={(v) => updateField('guardian_phone', v)}
                  onBlurValidate={() => blurValidate('guardian_phone')}
                  error={errors.guardian_phone}
                  placeholder="Enter guardian phone"
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={classSelected}
                />
                <FormInput
                  label="Guardian Email"
                  value={form.guardian_email}
                  onChangeText={(v) => updateField('guardian_email', v)}
                  onBlurValidate={() => blurValidate('guardian_email')}
                  error={errors.guardian_email}
                  placeholder="Enter guardian email"
                  keyboardType="email-address"
                  editable={classSelected}
                />
                <FormDropdown
                  label="Relationship"
                  options={relationOpts}
                  value={form.guardian_relationship}
                  onChange={(v) => updateField('guardian_relationship', v)}
                  placeholder="Select relationship"
                  disabled={!classSelected}
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
                  onChangeText={(v) => updateField('medical_conditions', v)}
                  placeholder="Any medical conditions or allergies"
                  multiline
                  numberOfLines={3}
                  editable={classSelected}
                />
                <FormInput
                  label="Description"
                  value={form.description}
                  onChangeText={(v) => updateField('description', v)}
                  placeholder="Additional notes"
                  multiline
                  numberOfLines={3}
                  editable={classSelected}
                />
              </FormSection>
            </Animated.View>
          )}

          {!quickAdd && (
            <Animated.View entering={FadeInDown.delay(340)}>
              <FormSection title="Emergency Contact" icon="🆘">
                <FormInput
                  label="Emergency Contact Name"
                  value={form.emergency_contact_name}
                  onChangeText={(v) => updateField('emergency_contact_name', v)}
                  placeholder="Enter contact name"
                  editable={classSelected}
                />
                <FormInput
                  label="Emergency Contact Phone"
                  value={form.emergency_contact_phone}
                  onChangeText={(v) => updateField('emergency_contact_phone', v)}
                  onBlurValidate={() => blurValidate('emergency_contact_phone')}
                  error={errors.emergency_contact_phone}
                  placeholder="Enter contact phone"
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={classSelected}
                />
              </FormSection>
            </Animated.View>
          )}

          {!quickAdd && (
            <Animated.View entering={FadeInDown.delay(380)}>
              <TouchableOpacity
                style={st.colH}
                onPress={() => setPrevSchoolExpanded(!prevSchoolExpanded)}
                activeOpacity={0.7}
              >
                <Text style={st.colT}>
                  🏫 Previous School <Text style={st.opt}>(Optional)</Text>
                </Text>
                {prevSchoolExpanded ? (
                  <ChevronUp size={20} color="#64748b" />
                ) : (
                  <ChevronDown size={20} color="#64748b" />
                )}
              </TouchableOpacity>
              {prevSchoolExpanded && (
                <View style={st.colB}>
                  <FormInput
                    label="Previous School Name"
                    value={form.previous_school_name}
                    onChangeText={(v) => updateField('previous_school_name', v)}
                    placeholder="Enter previous school name"
                  />
                  <FormInput
                    label="Previous School Class"
                    value={form.previous_school_class}
                    onChangeText={(v) => updateField('previous_school_class', v)}
                    placeholder="Enter previous class"
                  />
                  <FormInput
                    label="Previous School Address"
                    value={form.previous_school_address}
                    onChangeText={(v) => updateField('previous_school_address', v)}
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
                style={st.colH}
                onPress={() => setAddressExpanded(!addressExpanded)}
                activeOpacity={0.7}
              >
                <Text style={st.colT}>
                  📍 Address <Text style={st.opt}>(Optional)</Text>
                </Text>
                {addressExpanded ? (
                  <ChevronUp size={20} color="#64748b" />
                ) : (
                  <ChevronDown size={20} color="#64748b" />
                )}
              </TouchableOpacity>
              {addressExpanded && (
                <View style={st.colB}>
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
            style={st.subBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.subGrad}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={st.subText}>Create Student</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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

const st = StyleSheet.create({
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
  infoBanner: {
    backgroundColor: '#dbeafe',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoBannerText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
  hint: {
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  hintText: { fontSize: 13, color: '#92400e' },
  colH: {
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
  colT: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  opt: { fontSize: 13, fontWeight: '400', color: '#94a3b8' },
  colB: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#f0f0f0',
    marginBottom: 14,
  },
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
