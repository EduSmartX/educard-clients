/**
 * Create Student Screen — thin wrapper over StudentFormBase.
 * Photo is picked via FormPhotoUpload and uploaded after the student is created.
 */

import {
  BLOOD_GROUP_OPTIONS,
  RELATIONSHIP_OPTIONS,
  studentQuickSchema,
  studentFullSchema,
  validateField,
  validateAllFields,
  buildStudentPayload,
  parseApiErrors,
  getErrorMessage,
  type ApiErrorData,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import { FormPhotoUpload } from '@/components/forms';
import {
  StudentFormBase,
  type StudentFormState,
  type FieldErrors,
} from '@/components/screens/StudentFormBase';
import { useManagedClasses } from '@/features/classes';
import { uploadProfilePhoto } from '@/features/core';
import { useCreateStudent, useRestoreStudent } from '@/features/students';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';
import { isTeacherRole } from '@/utils/role-utils';

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

interface CreateStudentResponse {
  data?: { user_info?: { public_id?: string } };
  user_info?: { public_id?: string };
}

export default function CreateStudentScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const createMutation = useCreateStudent();
  const restoreMutation = useRestoreStudent();
  const scrollRef = useRef<KeyboardAwareScrollView>(null);

  const isTeacher = isTeacherRole(user?.role);
  const { data: classesData } = useManagedClasses('student');

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: Record<string, unknown>;
    deletedRecordId: string | null;
  }>();

  const [quickAdd, setQuickAdd] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [prevSchoolExpanded, setPrevSchoolExpanded] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [form, setForm] = useState<StudentFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const schema = quickAdd ? studentQuickSchema : studentFullSchema;

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
        schema,
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
    [form, schema],
  );

  const submitCreate = useCallback(
    (payload: Record<string, unknown>, forceCreate: boolean) => {
      createMutation.mutate(
        { data: payload, forceCreate },
        {
          onSuccess: (response: CreateStudentResponse) => {
            duplicateHandler.closeDialog();
            const uid =
              response?.data?.user_info?.public_id ||
              response?.user_info?.public_id;
            if (photoUri && uid) {
              uploadProfilePhoto(uid, photoUri, 'photo.jpg').catch(
                () => undefined,
              );
            }
            navigation.goBack();
          },
          onError: (err: unknown) => {
            if (isDeletedDuplicateError(err)) {
              const msg = getDeletedDuplicateMessage(err);
              const recordId = getDeletedRecordId(err);
              duplicateHandler.openDialog(msg, {
                payload,
                deletedRecordId: recordId,
              });
              return;
            }
            const axiosError = err as { response?: { data?: ApiErrorData } };
            const { fieldErrors: afe, generalError } = parseApiErrors(
              axiosError?.response?.data,
            );
            if (Object.keys(afe).length > 0) {
              setErrors(afe);
              return;
            }
            setApiError(generalError || 'Failed to create student.');
          },
        },
      );
    },
    [createMutation, navigation, photoUri, duplicateHandler],
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fe = validateAllFields(schema, { ...form });
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildStudentPayload({ ...form }, quickAdd);
    submitCreate(payload, false);
  }, [form, quickAdd, schema, submitCreate]);

  const handleReactivate = useCallback(() => {
    const recordId = duplicateHandler.pendingData?.deletedRecordId;
    if (!recordId) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not find deleted record ID.',
      });
      return;
    }
    restoreMutation.mutate(
      { publicId: recordId },
      {
        onSuccess: () => {
          duplicateHandler.closeDialog();
          showToast({
            type: 'success',
            title: 'Restored',
            message: 'The deleted student has been reactivated.',
          });
          navigation.goBack();
        },
        onError: (error: unknown) => {
          showToast({
            type: 'error',
            title: 'Error',
            message: getErrorMessage(
              error,
              'Failed to reactivate. Please try again.',
            ),
          });
        },
      },
    );
  }, [duplicateHandler, restoreMutation, navigation, showToast]);

  const handleForceCreate = useCallback(() => {
    const payload = duplicateHandler.pendingData?.payload;
    if (payload) {
      duplicateHandler.closeDialog();
      submitCreate(payload, true);
    }
  }, [duplicateHandler, submitCreate]);

  const classSelected = !!form.class_id;

  return (
    <StudentFormBase
      title="Add New Student"
      subtitle="Enroll a new student"
      submitLabel="Create Student"
      submitting={createMutation.isPending}
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
      quickAdd={quickAdd}
      onQuickAddChange={setQuickAdd}
      classEditable
      fieldsEditable={classSelected}
      addressExpanded={addressExpanded}
      onToggleAddress={() => setAddressExpanded(v => !v)}
      prevSchoolExpanded={prevSchoolExpanded}
      onTogglePrevSchool={() => setPrevSchoolExpanded(v => !v)}
      scrollRef={scrollRef}
      basicInfoPhotoSlot={
        <FormPhotoUpload
          imageUri={photoUri}
          onImageSelected={uri => setPhotoUri(uri)}
          name={`${form.first_name} ${form.last_name}`.trim()}
          gender={form.gender}
        />
      }
      bannersSlot={
        isTeacher ? (
          <>
            <Animated.View entering={FadeInDown.delay(60)}>
              <View style={st.infoBanner}>
                <Text style={st.infoBannerText}>
                  ℹ️ You can add students only for classes where you are
                  assigned as the class teacher.
                </Text>
              </View>
            </Animated.View>
            {classOptions.length === 0 && (
              <Animated.View entering={FadeInDown.delay(60)}>
                <View style={st.warningBanner}>
                  <Text style={st.warningBannerText}>
                    ⚠️ You are not assigned as a class teacher for any class.
                    Please contact your administrator to be assigned as a class
                    teacher before adding students.
                  </Text>
                </View>
              </Animated.View>
            )}
          </>
        ) : null
      }
      classHintSlot={
        !classSelected ? (
          <View style={st.hint}>
            <Text style={st.hintText}>
              ⚠️ Please select a class to continue filling the student
              information.
            </Text>
          </View>
        ) : null
      }
    >
      <DeletedDuplicateModal
        visible={duplicateHandler.isOpen}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
        isLoading={restoreMutation.isPending || createMutation.isPending}
      />
    </StudentFormBase>
  );
}

const st = StyleSheet.create({
  infoBanner: {
    backgroundColor: '#dbeafe',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoBannerText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
  warningBanner: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningBannerText: { fontSize: 13, color: '#b91c1c', lineHeight: 18 },
  hint: {
    backgroundColor: '#fffbeb',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  hintText: { fontSize: 13, color: '#92400e' },
});
