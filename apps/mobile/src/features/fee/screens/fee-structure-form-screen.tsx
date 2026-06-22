/**
 * Fee Structure Form Screen
 * Create / Edit fee structure with fee components
 */

import type { FeeStructureCreatePayload, Class } from '@educard/shared';
import { ComponentType, COMPONENT_TYPE_OPTIONS } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Trash2, IndianRupee, AlertTriangle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SubmitButton } from '@/components/common/SubmitButton';
import { buildClassOptions } from '@/components/filters';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormDropdown } from '@/components/forms/FormDropdown';
import { FormInput } from '@/components/forms/FormInput';
import { FormMultiSelect } from '@/components/forms/FormMultiSelect';
import { AcademicYearDropdown } from '@/components/forms/AcademicYearDropdown';
import { useClasses } from '@/features/classes';
import { useCurrentAcademicYear } from '@/features/core';
import { useAndroidBack } from '@/hooks';
import { extractApiError } from '@/utils/api-error';

import { fetchClassChangeImpact } from '../api';
import { useFeeStructure, useCreateFeeStructure, useUpdateFeeStructure } from '../hooks';

/** Build impact message lines from class change impact response */
function buildImpactLines(impact: {
  students_will_be_assigned: number;
  unpaid_fees_will_be_deleted: number;
  paid_fees_will_be_cancelled: number;
  total_paid_amount_affected: number | string;
}): string[] {
  const lines: string[] = [];
  if (impact.students_will_be_assigned > 0) {
    lines.push(
      `• ${impact.students_will_be_assigned} student fee record(s) will be auto-assigned in newly linked classes.`
    );
  }
  if (impact.unpaid_fees_will_be_deleted > 0) {
    lines.push(
      `• ${impact.unpaid_fees_will_be_deleted} unpaid student fee record(s) will be deleted.`
    );
  }
  if (impact.paid_fees_will_be_cancelled > 0) {
    lines.push(
      `• ${impact.paid_fees_will_be_cancelled} paid/partial records will be marked as Cancelled.`
    );
  }
  if (Number(impact.total_paid_amount_affected) > 0) {
    lines.push(
      `• ₹${Number(impact.total_paid_amount_affected).toLocaleString('en-IN')} already collected may need refund handling.`
    );
  }
  return lines;
}

/** Normalize fee components for comparison */
function normalizeComponents(
  list: { name: string; amount: number | string; component_type?: string }[]
): string {
  return [...list]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (component) =>
        `${component.name}|${Number(component.amount).toFixed(2)}|${component.component_type ?? ''}`
    )
    .join(',');
}

// ─── types ────────────────────────────────────────────────────────────────────

interface ComponentRow {
  key: string;
  name: string;
  amount: string;
  component_type: string;
  order: number;
}

interface FormErrors {
  name?: string;
  academic_year?: string;
  due_date?: string;
  class_public_ids?: string;
  components?: string;
  [key: string]: string | undefined;
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function FeeStructureFormScreen() {
  const router = useRouter();
  useAndroidBack('/(tabs)/(admin)/fee-structures');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  // Fetch existing structure for edit
  const { data: existing, isLoading: isLoadingStructure } = useFeeStructure(id ?? '');

  // Classes for multi-select
  const { data: classesData } = useClasses({ page_size: 200 });
  const classOptions = buildClassOptions((classesData?.classes ?? []) as Class[]);

  // Current academic year from DB
  const { data: currentAcademicYear } = useCurrentAcademicYear();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classIds, setClassIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [components, setComponents] = useState<ComponentRow[]>([
    {
      key: '1',
      name: 'Tuition Fee',
      amount: '',
      component_type: ComponentType.MANDATORY,
      order: 0,
    },
  ]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingImpact, setIsCheckingImpact] = useState(false);
  const [showImpactConfirm, setShowImpactConfirm] = useState(false);
  const [impactMessage, setImpactMessage] = useState('');
  const [pendingPayload, setPendingPayload] = useState<FeeStructureCreatePayload | null>(null);

  // Pre-fill academic year from DB (only for new structures)
  useEffect(() => {
    if (!isEditing && currentAcademicYear?.name) {
      setAcademicYear(currentAcademicYear.name);
    }
  }, [currentAcademicYear, isEditing]);

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description ?? '');
      setAcademicYear(existing.academic_year);
      setDueDate(existing.due_date);
      setClassIds(existing.class_public_ids ?? []);
      setIsActive(existing.is_active);
      if (existing.components?.length) {
        setComponents(
          existing.components.map((c, i) => ({
            key: String(i + 1),
            name: c.name,
            amount: String(c.amount),
            component_type: c.component_type,
            order: c.order ?? i,
          }))
        );
      }
    }
  }, [existing]);

  // Mutations
  const { mutate: createStructure, isPending: isCreating } = useCreateFeeStructure();
  const { mutate: updateStructure, isPending: isUpdating } = useUpdateFeeStructure();
  const isSaving = isCreating || isUpdating;

  // ── Component CRUD ─────────────────────────────────────────────────────────
  const addComponent = useCallback(() => {
    setComponents((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        name: '',
        amount: '',
        component_type: ComponentType.MANDATORY,
        order: prev.length,
      },
    ]);
  }, []);

  const removeComponent = useCallback((key: string) => {
    setComponents((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const updateComponent = useCallback((key: string, field: keyof ComponentRow, value: string) => {
    setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!academicYear) e.academic_year = 'Academic year is required';
    if (!dueDate) e.due_date = 'Due date is required';
    if (classIds.length === 0) e.class_public_ids = 'Select at least one class';
    if (components.length === 0) e.components = 'Add at least one fee component';
    for (const comp of components) {
      if (!comp.name.trim()) {
        e.components = 'All components must have a name';
        break;
      }
      if (!comp.amount || Number.isNaN(Number(comp.amount)) || Number(comp.amount) <= 0) {
        e.components = 'All components must have a valid amount';
        break;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, academicYear, dueDate, classIds, components]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const persistUpdate = useCallback(
    (payload: FeeStructureCreatePayload) => {
      if (!id) return;
      const onError = (err: Error) => {
        const msg = extractApiError(err) || 'Something went wrong';
        Alert.alert('Error', msg);
      };
      updateStructure(
        { id, data: payload },
        { onSuccess: () => router.push('/(tabs)/(admin)/fee-structures'), onError }
      );
    },
    [id, router, updateStructure]
  );

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload: FeeStructureCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      academic_year: academicYear,
      due_date: dueDate,
      class_public_ids: classIds,
      is_active: isActive,
      components: components.map((c, i) => ({
        name: c.name.trim(),
        amount: Number(c.amount),
        component_type: c.component_type as 'mandatory' | 'optional',
        order: i,
      })),
    };

    const onError = (err: Error) => {
      const msg = extractApiError(err) || 'Something went wrong';
      Alert.alert('Error', msg);
    };

    if (isEditing && id) {
      const runImpactCheck = async () => {
        if (!existing) {
          persistUpdate(payload);
          return;
        }

        const existingClassIds = existing.class_public_ids ?? [];
        const nextClassIds = payload.class_public_ids ?? [];
        const classesChanged =
          existingClassIds.length !== nextClassIds.length ||
          !existingClassIds.every((cid) => nextClassIds.includes(cid));

        const oldAmount = Number(existing.total_amount ?? 0);
        const newAmount = payload.components.reduce(
          (sum, component) => sum + Number(component.amount),
          0
        );
        const amountChanged = Math.abs(oldAmount - newAmount) > 0.001;

        const componentsChanged =
          normalizeComponents(existing.components ?? []) !==
          normalizeComponents(payload.components ?? []);

        if (!classesChanged && !amountChanged && !componentsChanged) {
          persistUpdate(payload);
          return;
        }

        setIsCheckingImpact(true);
        try {
          const optionMap = new Map(
            classOptions.map((option) => [option.value, option.label] as const)
          );
          const addedClassIds = nextClassIds.filter((cid) => !existingClassIds.includes(cid));
          const removedClassIds = existingClassIds.filter((cid) => !nextClassIds.includes(cid));

          const lines: string[] = ['Please review impact before updating fee structure:'];

          if (componentsChanged) {
            lines.push(
              '• Fee components have been modified. Updated component breakdown will reflect on linked student fees.'
            );
          }

          if (amountChanged) {
            lines.push(
              oldAmount < newAmount
                ? `• Total fee increased from ₹${oldAmount.toLocaleString('en-IN')} to ₹${newAmount.toLocaleString('en-IN')}. Student balances will increase.`
                : `• Total fee decreased from ₹${oldAmount.toLocaleString('en-IN')} to ₹${newAmount.toLocaleString('en-IN')}. Student balances will reduce (overpaid students may show negative balance).`
            );
          }

          if (classesChanged) {
            if (addedClassIds.length > 0) {
              lines.push(
                `• Added classes: ${addedClassIds.map((cid) => optionMap.get(cid) ?? cid).join(', ')}`
              );
            }
            if (removedClassIds.length > 0) {
              lines.push(
                `• Removed classes: ${removedClassIds.map((cid) => optionMap.get(cid) ?? cid).join(', ')}`
              );
            }

            try {
              const impact = await fetchClassChangeImpact(id, nextClassIds);
              lines.push(...buildImpactLines(impact));
            } catch {
              lines.push(
                '• Could not fetch class change impact preview. Update will still proceed if confirmed.'
              );
            }
          }

          if (amountChanged || componentsChanged) {
            lines.push(
              '• Balance formula: New Total − Discount − Amount Already Paid. Existing payments will not be deleted.'
            );
          }

          lines.push('• This action cannot be undone.');

          setImpactMessage(lines.join('\n\n'));
          setPendingPayload(payload);
          setShowImpactConfirm(true);
        } finally {
          setIsCheckingImpact(false);
        }
      };

      void runImpactCheck();
    } else {
      createStructure(payload, {
        onSuccess: () => router.push('/(tabs)/(admin)/fee-structures'),
        onError,
      });
    }
  }, [
    validate,
    name,
    description,
    academicYear,
    dueDate,
    classIds,
    isActive,
    components,
    isEditing,
    id,
    existing,
    classOptions,
    persistUpdate,
    createStructure,
    router,
  ]);

  const handleConfirmImpactUpdate = useCallback(() => {
    if (!pendingPayload) return;
    persistUpdate(pendingPayload);
    setShowImpactConfirm(false);
    setPendingPayload(null);
  }, [pendingPayload, persistUpdate]);

  const totalAmount = components.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  if (isEditing && isLoadingStructure) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-structures')}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Fee Structure' : 'New Fee Structure'}
            </Text>
            <Text style={styles.headerSub}>
              {isEditing ? 'Update structure details' : 'Create a new fee structure'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        {/* Basic Info */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <FormInput
            label="Structure Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Annual Fee 2025-26"
            error={errors.name}
            required
          />
          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description..."
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />
          <AcademicYearDropdown
            value={academicYear}
            onChange={setAcademicYear}
            error={errors.academic_year}
            required
          />
          <FormDatePicker
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
            error={errors.due_date}
            required
            minYear={2020}
            maxYear={2035}
          />
        </Animated.View>

        {/* Classes */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>Assign to Classes</Text>
          <FormMultiSelect
            label="Classes"
            options={classOptions}
            value={classIds}
            onChange={setClassIds}
            error={errors.class_public_ids}
            required
            searchable
            placeholder="Select classes..."
          />
        </Animated.View>

        {/* Active toggle */}
        <Animated.View entering={FadeInDown.delay(175)} style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Active Status</Text>
              <Text style={styles.toggleSub}>
                Inactive structures won't be applied to new students
              </Text>
            </View>
            <View style={styles.toggleRight}>
              <View
                style={[styles.toggleDot, { backgroundColor: isActive ? '#059669' : '#94a3b8' }]}
              />
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
                thumbColor={isActive ? '#059669' : '#94a3b8'}
              />
            </View>
          </View>
        </Animated.View>

        {/* Fee Components */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.componentsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Fee Components</Text>
              {errors.components && <Text style={styles.errorText}>{errors.components}</Text>}
            </View>
            <TouchableOpacity style={styles.addCompBtn} onPress={addComponent}>
              <Plus size={16} color="#059669" />
              <Text style={styles.addCompText}>Add</Text>
            </TouchableOpacity>
          </View>

          {components.map((comp, index) => (
            <Animated.View
              key={comp.key}
              entering={FadeInDown.delay(index * 50)}
              style={styles.componentRow}
            >
              <View style={styles.compIndex}>
                <Text style={styles.compIndexText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <FormInput
                  label="Component Name"
                  value={comp.name}
                  onChangeText={(v) => updateComponent(comp.key, 'name', v)}
                  placeholder="e.g. Tuition Fee"
                />
                <View style={styles.compRow}>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Amount (₹)"
                      value={comp.amount}
                      onChangeText={(v) => updateComponent(comp.key, 'amount', v)}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormDropdown
                      label="Type"
                      options={[...COMPONENT_TYPE_OPTIONS]}
                      value={comp.component_type}
                      onChange={(v) => updateComponent(comp.key, 'component_type', v)}
                    />
                  </View>
                </View>
              </View>
              {components.length > 1 && (
                <TouchableOpacity
                  style={styles.removeCompBtn}
                  onPress={() => removeComponent(comp.key)}
                >
                  <Trash2 size={16} color="#dc2626" />
                </TouchableOpacity>
              )}
            </Animated.View>
          ))}

          {/* Total */}
          <View style={styles.totalRow}>
            <IndianRupee size={18} color="#059669" />
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(250)} style={{ paddingBottom: 40 }}>
          <SubmitButton
            label={isEditing ? 'Update Structure' : 'Create Structure'}
            onPress={handleSubmit}
            isLoading={isSaving || isCheckingImpact}
            variant="success"
          />
        </Animated.View>
      </KeyboardAwareScrollView>

      <ConfirmDialog
        visible={showImpactConfirm}
        title="Confirm Changes — Student Fee Impact"
        message={impactMessage}
        confirmText="Update Structure"
        confirmVariant="warning"
        icon={AlertTriangle}
        onConfirm={handleConfirmImpactUpdate}
        onCancel={() => {
          setShowImpactConfirm(false);
          setPendingPayload(null);
        }}
        isLoading={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  scroll: { padding: 16, gap: 12 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  toggleSub: { fontSize: 12, color: '#64748b', marginTop: 2, maxWidth: 220 },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleDot: { width: 12, height: 12, borderRadius: 6 },

  componentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  addCompBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  addCompText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  componentRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  compIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  compIndexText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  compRow: { flexDirection: 'row', gap: 10 },
  removeCompBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#059669' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#059669' },
});
