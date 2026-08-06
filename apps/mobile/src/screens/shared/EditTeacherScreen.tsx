/**
 * Edit Teacher Screen — thin wrapper over TeacherFormBase.
 * Photo is edited in-place via ProfileAvatar + useProfileImage (immediate upload).
 */

import {
  ADDRESS_TYPE,
  BLOOD_GROUP_OPTIONS,
  teacherFullSchema,
  validateField,
  validateAllFields,
  buildTeacherPayload,
  parseApiErrors,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import {
  TeacherFormBase,
  type TeacherFormState,
  type FieldErrors,
} from '@/components/screens/TeacherFormBase';
import { useRoleTypes, useSupervisors, useCoreSubjects } from '@/features/core';
import {
  useTeacherDetail,
  useUpdateTeacher,
  teacherKeys,
} from '@/features/teachers';
import { useProfileImage } from '@/hooks/useProfileImage';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';

export default function EditTeacherScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'TeacherEdit'>>();
  const { id } = route.params;
  const { data: teacher, isLoading: detailLoading } = useTeacherDetail(
    id || '',
  );
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
    additionalInvalidateKeys: id ? [teacherKeys.detail(id)] : undefined,
  });

  const [form, setForm] = useState<TeacherFormState>({
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
    subjects: [],
    address_type: ADDRESS_TYPE.USER_CURRENT,
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

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
        subjects: (teacher.subjects ?? []).map(
          s => s.id?.toString() ?? s.public_id,
        ),
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
    () =>
      (roleTypes ?? []).map(r => ({ value: r.id.toString(), label: r.name })),
    [roleTypes],
  );
  const supervisorOptions = useMemo(
    () =>
      (supervisors ?? [])
        .filter(sup => sup.email !== form.email)
        .map(sup => ({
          value: sup.email,
          label: `${sup.full_name} (${sup.email})`,
        })),
    [supervisors, form.email],
  );
  const bloodGroupOpts = useMemo(
    () => BLOOD_GROUP_OPTIONS.map(b => ({ value: b.value, label: b.label })),
    [],
  );
  const subjectOptions = useMemo(
    () =>
      (coreSubjects ?? []).map(sub => ({
        value: sub.id.toString(),
        label: sub.name,
      })),
    [coreSubjects],
  );

  const updateField = useCallback(
    (field: string, value: string | string[]) => {
      setForm(prev => ({ ...prev, [field]: value }));
      if (errors[field])
        setErrors(prev => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
    },
    [errors],
  );

  const blurValidate = useCallback(
    (field: string) => {
      const val = form[field as keyof TeacherFormState];
      const err = validateField(
        teacherFullSchema,
        field,
        typeof val === 'string' ? val : '',
      );
      setErrors(prev => {
        if (err) return { ...prev, [field]: err };
        const n = { ...prev };
        delete n[field];
        return n;
      });
    },
    [form],
  );

  const handleSubmit = useCallback(() => {
    if (updateMutation.isPending) return;
    setApiError(null);
    const fieldErrors = validateAllFields(teacherFullSchema, { ...form });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      scrollRef.current?.scrollToPosition(0, 0, true);
      return;
    }
    const payload = buildTeacherPayload({ ...form }, false);
    if (form.subjects.length > 0) {
      payload.subjects = form.subjects.map(Number);
    }
    updateMutation.mutate(
      { publicId: id ?? '', data: payload },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (err: unknown) => {
          const apiErr = err as {
            response?: { data?: Record<string, unknown> };
            message?: string;
          };
          if (apiErr.response?.data) {
            const { fieldErrors: fe, generalError } = parseApiErrors(
              apiErr.response.data,
            );
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
      },
    );
  }, [form, id, updateMutation, navigation]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, layoutStyles.centered]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading teacher data...</Text>
      </View>
    );
  }

  return (
    <TeacherFormBase
      title="Edit Teacher"
      subtitle={`${form.first_name} ${form.last_name}`}
      submitLabel="Update Teacher"
      submitting={updateMutation.isPending}
      form={form}
      errors={errors}
      apiError={apiError}
      onDismissError={() => setApiError(null)}
      roleOptions={roleOptions}
      rolesLoading={rolesLoading}
      supervisorOptions={supervisorOptions}
      supervisorsLoading={supervisorsLoading}
      bloodGroupOpts={bloodGroupOpts}
      subjectOptions={subjectOptions}
      updateField={updateField}
      blurValidate={blurValidate}
      onSubmit={handleSubmit}
      quickAdd={false}
      addressExpanded={addressExpanded}
      onToggleAddress={() => setAddressExpanded(v => !v)}
      scrollRef={scrollRef}
      topPhotoSlot={
        <Animated.View entering={FadeIn.delay(150)} style={styles.avatarWrap}>
          <ProfileAvatar
            name={`${form.first_name} ${form.last_name}`.trim()}
            imageUri={localPhotoUri ?? teacher?.profile_photo_thumbnail}
            size={90}
            onPress={pickAndUpload}
            isUploading={isPhotoUploading}
          />
          <Text style={styles.avatarName}>
            {form.first_name} {form.last_name}
          </Text>
        </Animated.View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingText: { marginTop: 12, color: '#64748b' },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatarName: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
});
