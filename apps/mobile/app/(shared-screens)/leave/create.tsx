/**
 * Create Leave Allocation Screen
 * Form to add a new leave allocation policy.
 */

import { extractApiError } from '@educard/shared';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';

import {
  LeaveAllocationFormBase,
  LeaveAllocationFormState,
} from '@/components/screens/LeaveAllocationFormBase';
import { useLeaveTypes, useRoleTypes, useCurrentAcademicYear } from '@/features/core';
import { useCreateLeaveAllocation } from '@/features/leave';
import { useToast } from '@/lib/toast-context';

type FieldErrors = Record<string, string>;

export default function CreateLeaveAllocationScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateLeaveAllocation();
  const { data: leaveTypes, isLoading: leaveTypesLoading } = useLeaveTypes();
  const { data: roleTypes } = useRoleTypes();
  const { data: currentAcademicYear } = useCurrentAcademicYear();

  const [rolesModalVisible, setRolesModalVisible] = useState(false);
  const [form, setForm] = useState<LeaveAllocationFormState>({
    leave_type: '',
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
        router.back();
      },
      onError: (err: unknown) => {
        setApiError(extractApiError(err, 'Failed to create leave allocation'));
      },
    });
  }, [form, validate, createMutation, router, showToast]);

  return (
    <LeaveAllocationFormBase
      title="Create Allocation"
      subtitle="New leave policy"
      submitLabel="Create Allocation"
      form={form}
      errors={errors}
      apiError={apiError}
      isSaving={createMutation.isPending}
      leaveTypes={leaveTypes}
      leaveTypesLoading={leaveTypesLoading}
      roleTypes={roleTypes}
      rolesModalVisible={rolesModalVisible}
      setRolesModalVisible={setRolesModalVisible}
      updateField={updateField}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
    />
  );
}
