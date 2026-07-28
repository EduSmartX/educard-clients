/**
 * Edit Student Screen — thin wrapper over StudentFormBase.
 * Photo is edited in-place via ProfileAvatar + useProfileImage (immediate upload).
 */

import {
  BLOOD_GROUP_OPTIONS,
  RELATIONSHIP_OPTIONS,
  studentFullSchema,
  validateField,
  validateAllFields,
  buildStudentPayload,
  parseApiErrors,
  type Student,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import {
  StudentFormBase,
  type StudentFormState,
  type FieldErrors,
} from '@/components/screens/StudentFormBase';
import { useManagedClasses } from '@/features/classes';
import {
  useStudentDetail,
  useUpdateStudent,
  studentKeys,
} from '@/features/students';
import { useProfileImage } from '@/hooks/useProfileImage';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';

const INITIAL_FORM: StudentFormState = {
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
};

export default function EditStudentScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'StudentEdit'>>();
  const { id } = route.params;
  const {
    data: student,
    isLoading: detailLoading,
    dataUpdatedAt,
  } = useStudentDetail(id || '');
  const updateMutation = useUpdateStudent();
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
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
    additionalInvalidateKeys: id ? [studentKeys.detail(id)] : undefined,
  });

  const classOptions = useMemo(() => {
    const items = classesData?.classes ?? [];
    return items.map(c => ({
      value: c.public_id,
      label: `${c.class_master?.name ?? ''} - ${c.name}`.trim(),
    }));
  }, [classesData]);

  const bloodGroupOpts = BLOOD_GROUP_OPTIONS.map(b => ({
    value: b.value,
    label: b.label,
  }));
  const relationOpts = RELATIONSHIP_OPTIONS.map(r => ({
    value: r.value,
    label: r.label,
  }));

  const [form, setForm] = useState<StudentFormState>(INITIAL_FORM);
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
      const err = validateField(
        studentFullSchema,
        field,
        form[field as keyof StudentFormState],
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
    const fe = validateAllFields(studentFullSchema, { ...form });
    setErrors(fe);
    if (Object.keys(fe).length > 0) {
      scrollRef.current?.scrollToPosition(0, 0, true);
      return;
    }
    if (!id) return;

    const payload = buildStudentPayload({ ...form }, false) as Partial<Student>;
    updateMutation.mutate(
      { publicId: id, data: payload },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (err: unknown) => {
          const apiErr = err as {
            response?: { data?: Record<string, unknown> };
          };
          const { fieldErrors: fieldErr, generalError } = parseApiErrors(
            apiErr?.response?.data,
          );
          if (Object.keys(fieldErr).length > 0) {
            setErrors(fieldErr);
            scrollRef.current?.scrollToPosition(0, 0, true);
            return;
          }
          setApiError(generalError ?? 'Failed to update student.');
        },
      },
    );
  }, [form, id, updateMutation, navigation]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, layoutStyles.centered]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading student data...</Text>
      </View>
    );
  }

  return (
    <StudentFormBase
      title="Edit Student"
      subtitle={`${form.first_name} ${form.last_name}`}
      submitLabel="Update Student"
      submitting={updateMutation.isPending}
      form={form}
      errors={errors}
      apiError={apiError}
      onDismissError={() => setApiError(null)}
      classOptions={classOptions}
      bloodGroupOpts={bloodGroupOpts}
      relationOpts={relationOpts}
      updateField={updateField}
      blurValidate={blurValidate}
      onSubmit={handleSubmit}
      quickAdd={false}
      classEditable={false}
      fieldsEditable
      addressExpanded={addressExpanded}
      onToggleAddress={() => setAddressExpanded(v => !v)}
      prevSchoolExpanded={prevSchoolExpanded}
      onTogglePrevSchool={() => setPrevSchoolExpanded(v => !v)}
      scrollRef={scrollRef}
      topPhotoSlot={
        <Animated.View entering={FadeIn.delay(150)} style={styles.avatarWrap}>
          <ProfileAvatar
            name={`${form.first_name} ${form.last_name}`.trim()}
            imageUri={localPhotoUri ?? student?.profile_photo_thumbnail}
            size={90}
            onPress={pickAndUpload}
            isUploading={isPhotoUploading}
            cacheVersion={dataUpdatedAt}
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
