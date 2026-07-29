/**
 * Create Subject Screen
 */

import { extractApiError, getFieldErrors } from '@educard/shared';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FormInput, FormSection } from '@/components/forms';
import { QuickCreateFormBase } from '@/components/screens/QuickCreateFormBase';
import { useCreateSubject } from '@/features/subjects';
import { validateForm, hasErrors, required, type FieldErrors } from '@/utils/validation';

const RULES = {
  name: [required('Subject name')],
};

export default function CreateSubjectScreen() {
  const router = useRouter();
  const createMutation = useCreateSubject();

  const [form, setForm] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fieldErrors = validateForm(form, RULES);
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    createMutation.mutate(
      { data: { name: form.name.trim(), code: form.code.trim() || undefined } },
      {
        onSuccess: () => router.back(),
        onError: (err: unknown) => {
          const fe = getFieldErrors(err);
          if (Object.keys(fe).length > 0) {
            setErrors((prev) => ({ ...prev, ...fe }));
            return;
          }
          setApiError(extractApiError(err, 'Failed to create subject.'));
        },
      }
    );
  }, [form, createMutation, router]);

  return (
    <QuickCreateFormBase
      title="Add Subject"
      subtitle="Create a new subject"
      submitLabel="Create Subject"
      isSaving={createMutation.isPending}
      apiError={apiError}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <FormSection title="Subject Details" icon="📚">
          <FormInput
            label="Subject Name"
            required
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            placeholder="e.g. Mathematics"
          />
          <FormInput
            label="Subject Code"
            value={form.code}
            onChangeText={(v) => updateField('code', v)}
            placeholder="e.g. MATH101"
            hint="Optional unique code"
          />
        </FormSection>
      </Animated.View>
    </QuickCreateFormBase>
  );
}
