/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
/**
 * Edit Subject Screen — Uses shared SubjectFormBase
 */

import {
  subjectFormSchema,
  validateAllFields,
  buildSubjectPayload,
  parseApiErrors,
} from '@educard/shared';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import {
  SubjectFormBase,
  SubjectFormState,
  FieldErrors,
} from '@/components/screens/SubjectFormBase';
import { useManagedClasses } from '@/features/classes';
import { useCoreSubjects } from '@/features/core';
import { useSubjectDetail, useUpdateSubject } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { layoutStyles } from '@/styles';

export default function EditSubjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: detailLoading } = useSubjectDetail(id || '');
  const updateMutation = useUpdateSubject();
  const { data: classesData } = useManagedClasses('subject');
  const { data: coreSubjects, isLoading: subjectsLoading } = useCoreSubjects();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const [formLoaded, setFormLoaded] = useState(false);

  const classOpts = useMemo(() => {
    const items = classesData?.classes || [];
    return items.map(
      (c: { public_id: string; name: string; class_master?: { name?: string } | null }) => ({
        value: c.public_id,
        label: `${c.class_master?.name || ''} - ${c.name}`.trim(),
      })
    );
  }, [classesData]);

  const subjectOpts = useMemo(
    () => (coreSubjects || []).map((s) => ({ value: s.id.toString(), label: s.name })),
    [coreSubjects]
  );

  const teacherOpts = useMemo(() => {
    const teachers = teachersData?.teachers || [];
    return teachers.map((t: { public_id: string; full_name: string; email: string }) => ({
      value: t.public_id,
      label: `${t.full_name} (${t.email})`,
    }));
  }, [teachersData]);

  const [form, setForm] = useState<SubjectFormState>({
    class_id: '',
    subject_id: '',
    subject_type: 'core',
    teacher_id: '',
    description: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (subject && !formLoaded) {
      const s = subject as {
        class_info?: { public_id?: string };
        class_assigned?: { public_id?: string };
        class_id?: string;
        subject_info?: { id?: number };
        subject_master?: { id?: number };
        subject_id?: string;
        subject_type?: string;
        teacher_info?: { public_id?: string };
        teacher?: { public_id?: string };
        teacher_assigned?: { public_id?: string };
        teacher_id?: string;
        description?: string;
      };
      setForm({
        class_id: s.class_info?.public_id || s.class_assigned?.public_id || s.class_id || '',
        subject_id: String(s.subject_info?.id || s.subject_master?.id || s.subject_id || ''),
        subject_type: (s.subject_type as 'core' | 'elective' | 'language') || 'core',
        teacher_id: s.teacher_info?.public_id || s.teacher?.public_id || s.teacher_id || '',
        description: s.description || '',
      });
      setFormLoaded(true);
    }
  }, [subject, formLoaded]);

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

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fe = validateAllFields(subjectFormSchema, { ...form });
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildSubjectPayload({ ...form });
    updateMutation.mutate(
      { publicId: id, data: payload },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: Record<string, unknown> } };
          const { fieldErrors: fe2, generalError } = parseApiErrors(apiErr?.response?.data);
          if (Object.keys(fe2).length > 0) {
            setErrors(fe2);
            return;
          }
          setApiError(generalError || 'Failed to update subject.');
        },
      }
    );
  }, [form, id, updateMutation, router]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading subject data...</Text>
      </View>
    );
  }

  return (
    <SubjectFormBase
      title="Edit Subject"
      subtitle="Update subject assignment"
      submitLabel="Update Subject"
      form={form}
      errors={errors}
      apiError={apiError}
      isSaving={updateMutation.isPending}
      classOpts={classOpts}
      subjectOpts={subjectOpts}
      subjectsLoading={subjectsLoading}
      teacherOpts={teacherOpts}
      updateField={updateField}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
    />
  );
}
