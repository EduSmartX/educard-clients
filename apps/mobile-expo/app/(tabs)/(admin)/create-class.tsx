/**
 * Create Class Screen
 */

import { extractApiError, getFieldErrors } from '@educard/shared';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FormInput, FormSection } from '@/components/forms';
import { QuickCreateFormBase } from '@/components/screens/QuickCreateFormBase';
import { useCreateClass } from '@/features/classes';
import {
  validateForm,
  hasErrors,
  required,
  numberRange,
  type FieldErrors,
} from '@/utils/validation';

const RULES = {
  name: [required('Section name')],
  capacity: [numberRange('Capacity', 1, 500)],
};

export default function CreateClassScreen() {
  const router = useRouter();
  const createMutation = useCreateClass();

  const [form, setForm] = useState({ name: '', capacity: '', info: '' });
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

    const payload = {
      name: form.name.trim(),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      info: form.info.trim() || undefined,
    };

    createMutation.mutate(
      { data: payload },
      {
        onSuccess: () => router.back(),
        onError: (err: unknown) => {
          const fe = getFieldErrors(err);
          if (Object.keys(fe).length > 0) {
            setErrors((prev) => ({ ...prev, ...fe }));
            return;
          }
          setApiError(extractApiError(err, 'Failed to create class.'));
        },
      }
    );
  }, [form, createMutation, router]);

  return (
    <QuickCreateFormBase
      title="Add Class"
      subtitle="Create a new section"
      submitLabel="Create Class"
      isSaving={createMutation.isPending}
      apiError={apiError}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <FormSection title="Class Details" icon="🏫">
          <FormInput
            label="Section Name"
            required
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
            placeholder="e.g. A, B, Nehru"
          />
          <FormInput
            label="Capacity"
            value={form.capacity}
            onChangeText={(v) => updateField('capacity', v)}
            error={errors.capacity}
            placeholder="e.g. 50"
            keyboardType="numeric"
          />
          <FormInput
            label="Description"
            value={form.info}
            onChangeText={(v) => updateField('info', v)}
            placeholder="Optional notes about this class"
            multiline
            numberOfLines={3}
          />
        </FormSection>
      </Animated.View>
    </QuickCreateFormBase>
  );
}
