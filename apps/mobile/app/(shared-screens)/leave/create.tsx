/**
 * Create Leave Allocation Screen
 * Form to add a new leave allocation policy.
 */

import { Colors, getRoleGradient, extractApiError, LeaveType, RoleType } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, Check } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SubmitButton } from '@/components/common';
import {
  FormInput,
  FormSection,
  FormError,
  FormDropdown,
  FormDatePicker,
} from '@/components/forms';
import { useLeaveTypes, useRoleTypes, useCurrentAcademicYear } from '@/features/core';
import { useCreateLeaveAllocation } from '@/features/leave';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function CreateLeaveAllocationScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateLeaveAllocation();
  const { data: leaveTypes, isLoading: leaveTypesLoading } = useLeaveTypes();
  const { data: roleTypes } = useRoleTypes();
  const { data: currentAcademicYear } = useCurrentAcademicYear();

  const [rolesModalVisible, setRolesModalVisible] = useState(false);
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

  // Pre-fill effective dates from current academic year
  useEffect(() => {
    if (currentAcademicYear) {
      setForm((prev) => ({
        ...prev,
        effective_from: prev.effective_from || currentAcademicYear.start_date,
        effective_to: prev.effective_to || currentAcademicYear.end_date,
      }));
    }
  }, [currentAcademicYear]);

  const leaveTypeOpts = useMemo(
    () =>
      (leaveTypes ?? []).map((lt: LeaveType) => ({
        value: lt.public_id,
        label: `${lt.name} (${lt.code})`,
      })),
    [leaveTypes]
  );

  const roleOpts = useMemo(
    () =>
      (roleTypes ?? []).map((r: RoleType) => ({
        value: r.id.toString(),
        label: r.name,
      })),
    [roleTypes]
  );

  // Get selected role names for display
  const selectedRoleNames = useMemo(() => {
    return form.roles
      .map((roleId) => roleOpts.find((r) => r.value === roleId)?.label)
      .filter(Boolean)
      .join(', ');
  }, [form.roles, roleOpts]);

  const updateField = useCallback(
    (field: string, value: string | boolean | string[]) => {
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
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Leave allocation created successfully.',
        });
        router.back();
      },
      onError: (err: unknown) => {
        setApiError(extractApiError(err, 'Failed to create leave allocation'));
      },
    });
  }, [form, validate, createMutation, router, showToast]);

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

      <KeyboardAwareScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={{ flex: 1 }}
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
                <TouchableOpacity
                  style={styles.roleDropdown}
                  onPress={() => setRolesModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.roleDropdownText,
                      !selectedRoleNames && styles.roleDropdownPlaceholder,
                    ]}
                    numberOfLines={2}
                  >
                    {selectedRoleNames || 'Select roles...'}
                  </Text>
                  <ChevronDown size={20} color={Colors.gray[400]} />
                </TouchableOpacity>
                {form.roles.length > 0 && (
                  <Text style={styles.selectedCount}>
                    {form.roles.length} role{form.roles.length > 1 ? 's' : ''} selected
                  </Text>
                )}
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
      </KeyboardAwareScrollView>

      {/* Roles Multi-Select Modal */}
      <Modal
        visible={rolesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRolesModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRolesModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Roles</Text>
            <FlatList
              data={roleOpts}
              keyExtractor={(item) => item.value}
              style={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = form.roles.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      const newRoles = isSelected
                        ? form.roles.filter((r) => r !== item.value)
                        : [...form.roles, item.value];
                      updateField('roles', newRoles);
                    }}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={14} color="#fff" />}
                    </View>
                    <Text
                      style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setRolesModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done ({form.roles.length} selected)</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  roleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  roleDropdownText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[700],
  },
  roleDropdownPlaceholder: {
    color: Colors.gray[400],
  },
  selectedCount: {
    fontSize: 12,
    color: Colors.primary[600],
    marginTop: 6,
    fontWeight: '500',
  },
  errorText: { fontSize: 12, color: Colors.danger[500], marginTop: 4 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionSelected: {
    backgroundColor: '#f0fdf4',
  },
  modalOptionText: {
    fontSize: 15,
    color: Colors.gray[700],
    marginLeft: 12,
  },
  modalOptionTextSelected: {
    color: Colors.success[700],
    fontWeight: '600',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.success[500],
    borderColor: Colors.success[500],
  },
  modalDoneBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
