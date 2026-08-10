/**
 * Create Teacher Screen — thin wrapper over TeacherFormBase.
 * Photo is picked via FormPhotoUpload and uploaded after the teacher is created.
 */

import {
  ADDRESS_TYPE,
  BLOOD_GROUP_OPTIONS,
  teacherQuickSchema,
  teacherFullSchema,
  validateField,
  validateAllFields,
  buildTeacherPayload,
  parseApiErrors,
  getErrorMessage,
  type CreateTeacherPayload,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useState, useCallback, useMemo, useRef } from 'react';
import type { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import { FormPhotoUpload } from '@/components/forms';
import {
  TeacherFormBase,
  type TeacherFormState,
  type FieldErrors,
} from '@/components/screens/TeacherFormBase';
import {
  useRoleTypes,
  useSupervisors,
  useCoreSubjects,
  uploadProfilePhoto,
} from '@/features/core';
import { useCreateTeacher, useRestoreTeacher } from '@/features/teachers';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';

const INITIAL_FORM: TeacherFormState = {
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
};

export default function CreateTeacherScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const createMutation = useCreateTeacher();
  const restoreMutation = useRestoreTeacher();
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const { data: roleTypes, isLoading: rolesLoading } = useRoleTypes();
  const { data: supervisors, isLoading: supervisorsLoading } = useSupervisors();
  const { data: coreSubjects } = useCoreSubjects();

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: Record<string, unknown>;
    deletedRecordId: string | null;
  }>();

  const [quickAdd, setQuickAdd] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [form, setForm] = useState<TeacherFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const schema = quickAdd ? teacherQuickSchema : teacherFullSchema;

  const roleOptions = useMemo(
    () =>
      (roleTypes || []).map(r => ({ value: r.id.toString(), label: r.name })),
    [roleTypes],
  );
  const supervisorOptions = useMemo(
    () =>
      (supervisors || []).map(s => ({
        value: s.email,
        label: `${s.full_name} (${s.email})`,
      })),
    [supervisors],
  );
  const bloodGroupOpts = BLOOD_GROUP_OPTIONS.map(b => ({
    value: b.value,
    label: b.label,
  }));
  const subjectOptions = useMemo(
    () =>
      (coreSubjects || []).map(s => ({
        value: s.id.toString(),
        label: s.name,
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
        schema,
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
    [form, schema],
  );

  const submitCreate = useCallback(
    (payload: Record<string, unknown>, forceCreate: boolean) => {
      createMutation.mutate(
        { data: payload as unknown as CreateTeacherPayload, forceCreate },
        {
          onSuccess: (response: {
            data?: { user?: { public_id?: string } };
            user?: { public_id?: string };
          }) => {
            duplicateHandler.closeDialog();
            const uid =
              response?.data?.user?.public_id || response?.user?.public_id;
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
            const apiErr = err as {
              response?: { data?: Record<string, unknown> };
              message?: string;
            };
            if (apiErr?.response?.data) {
              const { fieldErrors: fe, generalError } = parseApiErrors(
                apiErr.response.data,
              );
              if (Object.keys(fe).length > 0) {
                setErrors(fe);
                scrollRef.current?.scrollToPosition(0, 0, true);
                return;
              }
              setApiError(generalError || 'Failed to create teacher.');
            } else {
              setApiError(
                apiErr?.message || 'Network error. Please try again.',
              );
            }
          },
        },
      );
    },
    [createMutation, navigation, photoUri, duplicateHandler],
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fieldErrors = validateAllFields(schema, { ...form });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      scrollRef.current?.scrollToPosition(0, 0, true);
      return;
    }
    const payload = buildTeacherPayload({ ...form }, quickAdd);
    if (!quickAdd && form.subjects.length > 0) {
      payload.subjects = form.subjects.map(Number);
    }
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
    restoreMutation.mutate(recordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        showToast({
          type: 'success',
          title: 'Restored',
          message: 'The deleted teacher has been reactivated successfully.',
        });
        navigation.goBack();
      },
      onError: (error: unknown) => {
        showToast({
          type: 'error',
          title: 'Error',
          message: getErrorMessage(
            error,
            'Failed to reactivate the teacher. Please try again.',
          ),
        });
      },
    });
  }, [duplicateHandler, restoreMutation, navigation, showToast]);

  const handleForceCreate = useCallback(() => {
    const payload = duplicateHandler.pendingData?.payload;
    if (payload) {
      duplicateHandler.closeDialog();
      submitCreate(payload, true);
    }
  }, [duplicateHandler, submitCreate]);

  return (
    <TeacherFormBase
      title="Add New Teacher"
      subtitle="Add a new teacher to your organization"
      submitLabel="Create Teacher"
      submitting={createMutation.isPending}
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
      quickAdd={quickAdd}
      onQuickAddChange={setQuickAdd}
      addressExpanded={addressExpanded}
      onToggleAddress={() => setAddressExpanded(v => !v)}
      scrollRef={scrollRef}
      basicInfoPhotoSlot={
        <FormPhotoUpload
          imageUri={photoUri}
          onImageSelected={uri => setPhotoUri(uri)}
          name={`${form.first_name} ${form.last_name}`.trim()}
          gender={form.gender}
        />
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
    </TeacherFormBase>
  );
}
