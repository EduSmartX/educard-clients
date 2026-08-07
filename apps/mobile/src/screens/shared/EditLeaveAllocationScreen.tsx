/**
 * Edit Leave Allocation Screen
 * Fetches existing leave allocation, pre-populates form, PATCHes on save.
 */

import { extractApiError, LeaveType } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import {
  LeaveAllocationFormBase,
  LeaveAllocationFormState,
} from '@/components/screens/LeaveAllocationFormBase';
import { useLeaveTypes, useRoleTypes } from '@/features/core';
import {
  useLeaveAllocationDetail,
  useUpdateLeaveAllocation,
} from '@/features/leave';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';

type FieldErrors = Record<string, string>;

export default function EditLeaveAllocationScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'LeaveAllocationEdit'>>();
  const { id } = route.params;
  const { data: detail, isLoading: detailLoading } = useLeaveAllocationDetail(
    id ?? '',
  );
  const updateMutation = useUpdateLeaveAllocation();
  const { data: leaveTypes, isLoading: leaveTypesLoading } = useLeaveTypes();
  const { data: roleTypes } = useRoleTypes();

  const [formLoaded, setFormLoaded] = useState(false);
  const [rolesModalVisible, setRolesModalVisible] = useState(false);
  const [form, setForm] = useState<LeaveAllocationFormState>({
    leave_type: '',
    leave_type_name: '',
    name: '',
    description: '',
    total_days: '',
    max_carry_forward_days: '0',
    applies_to_all_roles: true,
    roles: [],
    effective_from: '',
    effective_to: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const allocation = detail?.data;

  // Pre-populate form
  useEffect(() => {
    if (allocation && leaveTypes && !formLoaded) {
      // Detail response nests `leave_type`; fall back to matching by name
      const matchedLeaveType = leaveTypes.find(
        (lt: LeaveType) =>
          lt.id === allocation.leave_type?.id ||
          lt.name ===
            (allocation.leave_type?.name ?? allocation.leave_type_name),
      );

      // Detail response returns `roles_details` objects; fall back to role_ids
      const roleIds =
        allocation.roles_details?.map(role => role.id) ??
        allocation.role_ids ??
        [];

      setForm({
        leave_type: matchedLeaveType ? String(matchedLeaveType.id) : '',
        leave_type_name:
          allocation.leave_type?.name ?? allocation.leave_type_name ?? '',
        name: allocation.name ?? '',
        description: allocation.description ?? '',
        total_days: allocation.total_days?.toString() ?? '',
        max_carry_forward_days:
          allocation.max_carry_forward_days?.toString() ?? '0',
        applies_to_all_roles: allocation.applies_to_all_roles ?? true,
        roles: roleIds.map(String),
        effective_from: allocation.effective_from ?? '',
        effective_to: allocation.effective_to ?? '',
      });
      setFormLoaded(true);
    }
  }, [allocation, leaveTypes, formLoaded]);

  const updateField = useCallback(
    (field: string, value: string | boolean | string[]) => {
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

  const validate = useCallback(() => {
    const errs: FieldErrors = {};
    if (!form.total_days || Number(form.total_days) <= 0)
      errs.total_days = 'Total days must be greater than 0';
    if (!form.effective_from)
      errs.effective_from = 'Effective from date is required';
    if (!form.applies_to_all_roles && form.roles.length === 0)
      errs.roles = 'Select at least one role';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validate() || !id) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      total_days: form.total_days,
      max_carry_forward_days: form.max_carry_forward_days ?? '0',
      applies_to_all_roles: form.applies_to_all_roles,
      roles: form.applies_to_all_roles ? [] : form.roles.map(Number),
      effective_from: form.effective_from,
      effective_to: form.effective_to || undefined,
    };

    updateMutation.mutate(
      { publicId: id, data: payload },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (err: unknown) => {
          setApiError(
            extractApiError(err, 'Failed to update leave allocation'),
          );
        },
      },
    );
  }, [form, validate, updateMutation, id, navigation]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, layoutStyles.centered]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading allocation...</Text>
      </View>
    );
  }

  return (
    <LeaveAllocationFormBase
      title="Edit Allocation"
      subtitle={form.name || 'Leave policy'}
      submitLabel="Update Allocation"
      form={form}
      errors={errors}
      apiError={apiError}
      isSaving={updateMutation.isPending}
      leaveTypes={leaveTypes}
      leaveTypesLoading={leaveTypesLoading}
      roleTypes={roleTypes}
      rolesModalVisible={rolesModalVisible}
      setRolesModalVisible={setRolesModalVisible}
      updateField={updateField}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
      leaveTypeDisabled
    />
  );
}

const styles = StyleSheet.create({
  loadingText: { marginTop: 12, color: '#64748b' },
});
