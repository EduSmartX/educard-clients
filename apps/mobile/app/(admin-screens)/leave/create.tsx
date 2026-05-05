/**
 * Create Leave Allocation Screen
 * Form to add a new leave allocation policy.
 */

import { Colors, getRoleGradient, extractApiError } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SubmitButton } from '@/components/common';
import {
  FormInput,
  FormSection,
  FormError,
  FormDropdown,
  FormDatePicker,
} from '@/components/forms';
import { useLeaveTypes, useRoleTypes } from '@/features/core';
import { useCreateLeaveAllocation } from '@/features/leave';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function CreateLeaveAllocationScreen() {
  const router = useRouter();
  const createMutation = useCreateLeaveAllocation();
  const { data: leaveTypes, isLoading: leaveTypesLoading } = useLeaveTypes();
  const { data: roleTypes, isLoading: rolesLoading } = useRoleTypes();

  const [form, setForm] = useState({
    leave_type: '',
    name: '',
    description: '',
    total_days: '',
    max_carry_forward_days: '0',
    applies_to_all_roles: true,
    roles: [] as string[],
    effective_from: '',
    effective_to: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const leaveTypeOpts = useMemo(
    () =>
      (leaveTypes || []).map((lt: any) => ({
        value: lt.id?.toString() || lt.public_id,
        label: `${lt.name} (${lt.code})`,
      })),
    [leaveTypes]
  );

  const roleOpts = useMemo(
    () =>
      (roleTypes || []).map((r: any) => ({
        value: r.id.toString(),
        label: r.name,
      })),
    [roleTypes]
  );

  const updateField = useCallback(
    (field: string, value: any) => {
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

  const validate = useCallback(() => {
    const errs: FieldErrors = {};
    if (!form.leave_type) errs.leave_type = 'Leave type is required';
    if (!form.total_days || Number(form.total_days) <= 0)
      errs.total_days = 'Total days must be greater than 0';
    if (!form.effective_from) errs.effective_from = 'Effective from date is required';
    if (!form.applies_to_all_roles && form.roles.length === 0)
      errs.roles = 'Select at least one role';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload = {
      leave_type: Number(form.leave_type),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      total_days: form.total_days,
      max_carry_forward_days: form.max_carry_forward_days || '0',
      applies_to_all_roles: form.applies_to_all_roles,
      roles: form.applies_to_all_roles ? [] : form.roles.map(Number),
      effective_from: form.effective_from,
      effective_to: form.effective_to || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Success', 'Leave allocation created successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (err: any) => {
        setApiError(extractApiError(err, 'Failed to create leave allocation'));
      },
    });
  }, [form, validate, createMutation, router]);

  const isSaving = createMutation.isPending;

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
              <Text style={headerStyles.title}>Create Allocation</Text>
              <Text style={headerStyles.subtitle}>New leave policy</Text>
            </View>
            <TouchableOpacity
              style={[headerStyles.primaryBtn, isSaving && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#7c3aed" />
              ) : (
                <Save size={20} color="#7c3aed" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

          <Animated.View entering={FadeInDown.delay(80)}>
            <FormSection title="Leave Type" icon="📋">
              <FormDropdown
                label="Leave Type"
                required
                options={leaveTypeOpts}
                value={form.leave_type}
                onChange={(v) => updateField('leave_type', v)}
                error={errors.leave_type}
                placeholder="Select leave type"
                searchable
                loading={leaveTypesLoading}
              />
              <FormInput
                label="Policy Name"
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                error={errors.name}
                placeholder="e.g. Casual Leave - Teaching Staff"
              />
              <FormInput
                label="Description"
                value={form.description}
                onChangeText={(v) => updateField('description', v)}
                placeholder="Optional description"
                multiline
              />
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120)}>
            <FormSection title="Days Configuration" icon="📅">
              <FormInput
                label="Total Days"
                required
                value={form.total_days}
                onChangeText={(v) => updateField('total_days', v)}
                error={errors.total_days}
                placeholder="e.g. 12"
                keyboardType="numeric"
              />
              <FormInput
                label="Max Carry Forward Days"
                value={form.max_carry_forward_days}
                onChangeText={(v) => updateField('max_carry_forward_days', v)}
                placeholder="e.g. 5"
                keyboardType="numeric"
              />
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160)}>
            <FormSection title="Role Assignment" icon="👥">
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Applies to all roles</Text>
                <Switch
                  value={form.applies_to_all_roles}
                  onValueChange={(v) => updateField('applies_to_all_roles', v)}
                  trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                  thumbColor={form.applies_to_all_roles ? '#7c3aed' : '#94a3b8'}
                />
              </View>
              {!form.applies_to_all_roles && (
                <>
                  {roleOpts.map((role) => {
                    const selected = form.roles.includes(role.value);
                    return (
                      <TouchableOpacity
                        key={role.value}
                        style={[styles.roleChip, selected && styles.roleChipSelected]}
                        onPress={() => {
                          const newRoles = selected
                            ? form.roles.filter((r) => r !== role.value)
                            : [...form.roles, role.value];
                          updateField('roles', newRoles);
                        }}
                      >
                        <Text
                          style={[styles.roleChipText, selected && styles.roleChipTextSelected]}
                        >
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {errors.roles && <Text style={styles.errorText}>{errors.roles}</Text>}
                </>
              )}
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <FormSection title="Effective Period" icon="⏰">
              <FormDatePicker
                label="Effective From"
                required
                value={form.effective_from}
                onChange={(v) => updateField('effective_from', v)}
                error={errors.effective_from}
                placeholder="Select start date"
              />
              <FormDatePicker
                label="Effective To"
                value={form.effective_to}
                onChange={(v) => updateField('effective_to', v)}
                placeholder="Select end date (optional)"
              />
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240)}>
            <SubmitButton
              label="Create Allocation"
              onPress={handleSubmit}
              isLoading={isSaving}
              icon={Save}
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray[700] },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleChipSelected: { backgroundColor: '#ede9fe', borderColor: '#7c3aed' },
  roleChipText: { fontSize: 14, color: Colors.gray[600] },
  roleChipTextSelected: { color: '#7c3aed', fontWeight: '600' },
  errorText: { fontSize: 12, color: Colors.danger[500], marginTop: 4 },
});
