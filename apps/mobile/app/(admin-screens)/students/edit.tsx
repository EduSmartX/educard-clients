/**
 * Edit Student Screen
 * Fetches existing student data, pre-populates form, PATCHes on save.
 */

import {
  getRoleGradient,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  RELATIONSHIP_OPTIONS,
  studentFullSchema,
  validateField,
  validateAllFields,
  buildStudentPayload,
  parseApiErrors,
  type Student,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
import { useManagedClasses } from '@/features/classes';
import { useStudentDetail, useUpdateStudent, studentKeys } from '@/features/students';
import { useProfileImage } from '@/hooks/useProfileImage';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function EditStudentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: student, isLoading: detailLoading, dataUpdatedAt } = useStudentDetail(id || '');
  const updateMutation = useUpdateStudent();
  // Fetch managed classes - for teachers, only classes where they are class teacher
  const { data: classesData } = useManagedClasses('student');

  const [addressExpanded, setAddressExpanded] = useState(false);
  const [prevSchoolExpanded, setPrevSchoolExpanded] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  const {
    pickAndUpload,
    isUploading: isPhotoUploading,
    localUri: localPhotoUri,
  } = useProfileImage({
    userPublicId: student?.user_info?.public_id,
    onSuccess: () => {
      // photo updated — queries will be invalidated automatically
    },
    // Invalidate student detail query when photo is updated
    additionalInvalidateKeys: id ? [studentKeys.detail(id)] : undefined,
  });

  const classOptions = useMemo(() => {
    const items = classesData?.classes ?? [];
    return items.map((c) => ({
      value: c.public_id,
      label: `${c.class_master?.name ?? ''} - ${c.name}`.trim(),
    }));
  }, [classesData]);

  const bloodGroupOpts = BLOOD_GROUP_OPTIONS.map((b) => ({ value: b.value, label: b.label }));
  const relationOpts = RELATIONSHIP_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

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

  useEffect(() => {
    if (student && !formLoaded) {
      const userInfo = student.user_info;
      const addr = userInfo?.address;
      setForm({
        class_id: student.class_info?.public_id ?? '',
        first_name: userInfo?.first_name ?? '',
        last_name: userInfo?.last_name ?? '',
        roll_number: student.roll_number ?? '',
        email: userInfo?.email ?? '',
        phone: userInfo?.phone ?? '',
        gender: userInfo?.gender ?? '',
        blood_group: userInfo?.blood_group ?? '',
        date_of_birth: userInfo?.date_of_birth ?? '',
        admission_number: student.admission_number ?? '',
        admission_date: student.admission_date ?? '',
        guardian_name: student.guardian_name ?? '',
        guardian_phone: student.guardian_phone ?? '',
        guardian_email: student.guardian_email ?? '',
        guardian_relationship: student.guardian_relationship ?? '',
        medical_conditions: student.medical_conditions ?? '',
        description: student.description ?? '',
        previous_school_name: student.previous_school_name ?? '',
        previous_school_class: student.previous_school_class ?? '',
        previous_school_address: student.previous_school_address ?? '',
        street_address: addr?.street_address ?? '',
        city: addr?.city ?? '',
        state: addr?.state ?? '',
        postal_code: addr?.zip_code ?? '',
        country: addr?.country ?? '',
      });
      setFormLoaded(true);
    }
  }, [student, formLoaded]);

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
      const err = validateField(studentFullSchema, field, form[field as keyof typeof form]);
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
    setApiError(null);
    const fe = validateAllFields(studentFullSchema, form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) {
      // Show user what fields have validation errors
      const errorFields = Object.keys(fe).join(', ');
      Alert.alert('Validation Error', `Please fix the following fields: ${errorFields}`);
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Student ID is missing');
      return;
    }

    const payload = buildStudentPayload(form, false) as Partial<Student>;
    updateMutation.mutate(
      { publicId: id, data: payload },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: Error & { response?: { data?: unknown } }) => {
          const { fieldErrors: fe, generalError } = parseApiErrors(err?.response?.data);
          if (Object.keys(fe).length > 0) {
            setErrors(fe);
            return;
          }
          setApiError(generalError ?? 'Failed to update student.');
        },
      }
    );
  }, [form, id, updateMutation, router]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading student data...</Text>
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
              <Text style={headerStyles.title}>Edit Student</Text>
              <Text style={headerStyles.subtitle}>
                {form.first_name} {form.last_name}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.form}
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
            imageUri={localPhotoUri ?? student?.profile_photo_thumbnail}
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

        <Animated.View entering={FadeInDown.delay(80)}>
          <FormSection title="Class Assignment" icon="🏫">
            <FormDropdown
              label="Class"
              required
              options={classOptions}
              value={form.class_id}
              onChange={() => {}}
              error={errors.class_id}
              placeholder="Select a class"
              searchable
              disabled
            />
          </FormSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)}>
          <FormSection title="Basic Information" icon="👤">
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
            <FormInput
              label="Roll Number"
              required
              value={form.roll_number}
              onChangeText={(v) => updateField('roll_number', v)}
              onBlurValidate={() => blurValidate('roll_number')}
              error={errors.roll_number}
              placeholder="Enter roll number"
            />
            <FormInput
              label="Email"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              onBlurValidate={() => blurValidate('email')}
              error={errors.email}
              placeholder="Enter email"
              keyboardType="email-address"
            />
            <FormInput
              label="Phone"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              onBlurValidate={() => blurValidate('phone')}
              error={errors.phone}
              placeholder="Enter phone"
              keyboardType="phone-pad"
              maxLength={10}
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

        <Animated.View entering={FadeInDown.delay(180)}>
          <FormSection title="Admission Information" icon="🎓">
            <FormInput
              label="Admission Number"
              value={form.admission_number}
              onChangeText={(v) => updateField('admission_number', v)}
              placeholder="Enter admission number"
            />
            <FormDatePicker
              label="Admission Date"
              value={form.admission_date}
              onChange={(v) => updateField('admission_date', v)}
            />
          </FormSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240)}>
          <FormSection title="Guardian Information" icon="👨‍👩‍👦">
            <FormInput
              label="Guardian Name"
              value={form.guardian_name}
              onChangeText={(v) => updateField('guardian_name', v)}
              placeholder="Enter guardian name"
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
            />
            <FormInput
              label="Guardian Email"
              value={form.guardian_email}
              onChangeText={(v) => updateField('guardian_email', v)}
              onBlurValidate={() => blurValidate('guardian_email')}
              error={errors.guardian_email}
              placeholder="Enter guardian email"
              keyboardType="email-address"
            />
            <FormDropdown
              label="Relationship"
              options={relationOpts}
              value={form.guardian_relationship}
              onChange={(v) => updateField('guardian_relationship', v)}
              placeholder="Select relationship"
            />
          </FormSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <FormSection title="Medical & Additional" icon="🏥">
            <FormInput
              label="Medical Conditions"
              value={form.medical_conditions}
              onChangeText={(v) => updateField('medical_conditions', v)}
              placeholder="Any medical conditions"
              multiline
              numberOfLines={3}
            />
            <FormInput
              label="Description"
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              placeholder="Additional notes"
              multiline
              numberOfLines={3}
            />
          </FormSection>
        </Animated.View>

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

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
          style={st.subBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.subGrad}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={st.subText}>Update Student</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40 },
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
