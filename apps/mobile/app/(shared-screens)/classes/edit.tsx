/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
/**
 * Edit Class Screen — Uses shared ClassFormBase
 */

import {
  classFormSchema,
  validateField,
  validateAllFields,
  buildClassPayload,
  parseApiErrors,
} from '@educard/shared';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import { ClassFormBase, ClassFormState, FieldErrors } from '@/components/screens/ClassFormBase';
import { useClassDetail, useUpdateClass } from '@/features/classes';
import { useCoreClasses } from '@/features/core';
import { useTeachers } from '@/features/teachers';
import { layoutStyles } from '@/styles';

export default function EditClassScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: classDetail, isLoading: detailLoading } = useClassDetail(id || '');
  const updateMutation = useUpdateClass();
  const { data: coreClasses, isLoading: coreLoading } = useCoreClasses();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const [formLoaded, setFormLoaded] = useState(false);

  const coreClassOpts = useMemo(
    () => (coreClasses || []).map((c) => ({ value: c.id.toString(), label: c.name })),
    [coreClasses]
  );
  const teacherOpts = useMemo(() => {
    const teachers = teachersData?.teachers || [];
    return teachers.map((t: any) => ({ value: t.public_id, label: `${t.full_name} (${t.email})` }));
  }, [teachersData]);

  const [form, setForm] = useState<ClassFormState>({
    class_master: '',
    name: '',
    capacity: '',
    class_teacher_id: '',
    room_number: '',
    info: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (classDetail && !formLoaded) {
      const detail = classDetail as any;
      setForm({
        class_master: detail.class_master?.id?.toString() || '',
        name: detail.name || detail.section || '',
        capacity: detail.capacity?.toString() || '',
        class_teacher_id: detail.class_teacher?.public_id || detail.class_teacher_id || '',
        room_number: detail.room_number || '',
        info: detail.info || detail.description || '',
      });
      setFormLoaded(true);
    }
  }, [classDetail, formLoaded]);

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
      const err = validateField(classFormSchema, field, form[field as keyof ClassFormState]);
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
    const fe = validateAllFields(classFormSchema, form as unknown as Record<string, unknown>);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildClassPayload(form as any);
    updateMutation.mutate(
      { publicId: id, data: payload },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: any) => {
          const { fieldErrors: fe2, generalError } = parseApiErrors(err?.response?.data);
          if (Object.keys(fe2).length > 0) {
            setErrors(fe2);
            return;
          }
          setApiError(generalError || 'Failed to update class.');
        },
      }
    );
  }, [form, id, updateMutation, router]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading class data...</Text>
      </View>
    );
  }

  return (
    <ClassFormBase
      title="Edit Class"
      subtitle={form.name}
      submitLabel="Update Class"
      form={form}
      errors={errors}
      apiError={apiError}
      isSaving={updateMutation.isPending}
      coreClassOpts={coreClassOpts}
      coreLoading={coreLoading}
      teacherOpts={teacherOpts}
      updateField={updateField}
      blurValidate={blurValidate}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
      classMasterDisabled
    />
  );
}
