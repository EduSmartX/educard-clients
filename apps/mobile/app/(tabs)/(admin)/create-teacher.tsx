/**
 * Create Teacher Screen
 * Form to add a new teacher with validation
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Save } from 'lucide-react-native';
import {
  Colors,
  getRoleGradient,
  getRoleThemeColors,
  extractApiError,
  getFieldErrors,
} from '@educard/shared';
import { useCreateTeacher } from '@/hooks';
import { FormInput, FormSelect, FormSection, FormError } from '@/components/forms';
import { GENDER_OPTIONS } from '@/constants';
import {
  validateForm,
  hasErrors,
  required,
  minLength,
  email,
  phone,
  type FieldErrors,
} from '@/utils/validation';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

const GENDER_CHIPS = [
  { value: 'M', label: '👨 Male' },
  { value: 'F', label: '👩 Female' },
  { value: 'O', label: 'Other' },
];

// Validation rules
const RULES = {
  first_name: [required('First name'), minLength('First name', 2)],
  last_name: [required('Last name')],
  email: [required('Email'), email()],
  employee_id: [required('Employee ID')],
  gender: [required('Gender')],
  phone: [phone('Phone')],
};

export default function CreateTeacherScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateTeacher();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_id: '',
    gender: '',
    designation: '',
    specialization: '',
    experience_years: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error on change
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
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
      employee_id: form.employee_id.trim(),
      designation: form.designation.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
      experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      user: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        gender: form.gender,
      },
    };

    createMutation.mutate(payload as any, {
      onSuccess: () => {
        showToast({ type: 'success', title: 'Success', message: 'Teacher created successfully' });
        router.back();
      },
      onError: (err: unknown) => {
        // Extract field-level validation errors from API response
        const fieldErrors = getFieldErrors(err);
        if (Object.keys(fieldErrors).length > 0) {
          // Map backend field names to form field names (e.g., user.email -> email)
          const mappedErrors: FieldErrors = {};
          Object.entries(fieldErrors).forEach(([key, message]) => {
            const fieldName = key.startsWith('user.') ? key.replace('user.', '') : key;
            mappedErrors[fieldName] = message;
          });
          setErrors((prev) => ({ ...prev, ...mappedErrors }));
          // Inline field errors are sufficient - no banner needed
          return;
        }
        // Show banner only for non-field errors (server errors, network issues, etc.)
        const msg = extractApiError(err, 'Failed to create teacher. Please check your input.');
        setApiError(msg);
      },
    });
  }, [form, createMutation, router]);

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Add Teacher</Text>
              <Text style={headerStyles.subtitle}>Fill in the details below</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={{ flex: 1 }}
      >
        <FormError message={apiError} onDismiss={() => setApiError(null)} />

        {/* Personal Info */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Personal Information" icon="👤">
            <FormInput
              label="First Name"
              required
              value={form.first_name}
              onChangeText={(v) => updateField('first_name', v)}
              error={errors.first_name}
              placeholder="e.g. John"
              autoCapitalize="words"
            />
            <FormInput
              label="Last Name"
              required
              value={form.last_name}
              onChangeText={(v) => updateField('last_name', v)}
              error={errors.last_name}
              placeholder="e.g. Smith"
              autoCapitalize="words"
            />
            <FormInput
              label="Email"
              required
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              placeholder="e.g. john@school.com"
              keyboardType="email-address"
            />
            <FormInput
              label="Phone"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              error={errors.phone}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              hint="10-15 digits"
            />
            <FormSelect
              label="Gender"
              required
              options={GENDER_CHIPS}
              value={form.gender}
              onChange={(v) => updateField('gender', v)}
              error={errors.gender}
            />
          </FormSection>
        </Animated.View>

        {/* Employment Info */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <FormSection title="Employment Details" icon="💼">
            <FormInput
              label="Employee ID"
              required
              value={form.employee_id}
              onChangeText={(v) => updateField('employee_id', v)}
              error={errors.employee_id}
              placeholder="e.g. EMP001"
            />
            <FormInput
              label="Designation"
              value={form.designation}
              onChangeText={(v) => updateField('designation', v)}
              placeholder="e.g. Senior Teacher"
            />
            <FormInput
              label="Specialization"
              value={form.specialization}
              onChangeText={(v) => updateField('specialization', v)}
              placeholder="e.g. Mathematics"
            />
            <FormInput
              label="Experience (years)"
              value={form.experience_years}
              onChangeText={(v) => updateField('experience_years', v)}
              placeholder="e.g. 5"
              keyboardType="numeric"
            />
          </FormSection>
        </Animated.View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={styles.submitBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.submitText}>Create Teacher</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  submitBtn: {
    marginTop: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
