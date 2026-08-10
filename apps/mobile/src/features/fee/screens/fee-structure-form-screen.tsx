/**
 * Fee Structure Form Screen
 * Create / Edit fee structure with fee components
 */

import type { FeeStructureCreatePayload, Class } from '@educard/shared';
import { ComponentType } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Plus, IndianRupee, AlertTriangle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SubmitButton } from '@/components/common/SubmitButton';
import { buildClassOptions } from '@/components/filters';
import { AcademicYearDropdown } from '@/components/forms/AcademicYearDropdown';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { FormInput } from '@/components/forms/FormInput';
import { FormMultiSelect } from '@/components/forms/FormMultiSelect';
import { ScreenHeader } from '@/components/ui';
import { useClasses } from '@/features/classes';
import { useCurrentAcademicYear } from '@/features/core';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { extractApiError } from '@/utils/api-error';

import { fetchClassChangeImpact } from '../api';
import {
  useFeeStructure,
  useCreateFeeStructure,
  useUpdateFeeStructure,
} from '../hooks';

import { FeeComponentRow } from './FeeComponentRow';
import { styles } from './fee-structure-form-styles';
import {
  buildImpactLines,
  normalizeComponents,
  type ComponentRow,
  type FormErrors,
} from './fee-structure-form-utils';

export default function FeeStructureFormScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'FeeStructureForm'>>();
  const id = route.params?.id;
  const isEditing = !!id;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Fetch existing structure for edit
  const { data: existing, isLoading: isLoadingStructure } = useFeeStructure(
    id ?? '',
  );

  // Classes for multi-select
  const { data: classesData } = useClasses({ page_size: 200 });
  const classOptions = buildClassOptions(
    (classesData?.classes ?? []) as Class[],
  );

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
  const [pendingPayload, setPendingPayload] =
    useState<FeeStructureCreatePayload | null>(null);

  // Pre-fill academic year from DB (only for new structures)
  useEffect(() => {
    if (!isEditing && currentAcademicYear?.public_id) {
      setAcademicYear(currentAcademicYear.public_id);
    }
  }, [currentAcademicYear, isEditing]);

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description ?? '');
      setAcademicYear(existing.academic_year_public_id ?? '');
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
          })),
        );
      }
    }
  }, [existing]);

  // Mutations
  const { mutate: createStructure, isPending: isCreating } =
    useCreateFeeStructure();
  const { mutate: updateStructure, isPending: isUpdating } =
    useUpdateFeeStructure();
  const isSaving = isCreating || isUpdating;

  // ── Component CRUD ─────────────────────────────────────────────────────────
  const addComponent = useCallback(() => {
    setComponents(prev => [
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
    setComponents(prev => prev.filter(c => c.key !== key));
  }, []);

  const updateComponent = useCallback(
    (key: string, field: keyof ComponentRow, value: string) => {
      setComponents(prev =>
        prev.map(c => (c.key === key ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const e: FormErrors = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!academicYear) e.academic_year = 'Academic year is required';
    if (!dueDate) e.due_date = 'Due date is required';
    if (classIds.length === 0) e.class_public_ids = 'Select at least one class';
    if (components.length === 0)
      e.components = 'Add at least one fee component';
    for (const comp of components) {
      if (!comp.name.trim()) {
        e.components = 'All components must have a name';
        break;
      }
      if (
        !comp.amount ||
        Number.isNaN(Number(comp.amount)) ||
        Number(comp.amount) <= 0
      ) {
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
        { onSuccess: () => navigation.navigate('FeeStructures'), onError },
      );
    },
    [id, navigation, updateStructure],
  );

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload: FeeStructureCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      academic_year_public_id: academicYear,
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
          !existingClassIds.every(cid => nextClassIds.includes(cid));

        const oldAmount = Number(existing.total_amount ?? 0);
        const newAmount = payload.components.reduce(
          (sum, component) => sum + Number(component.amount),
          0,
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
            classOptions.map(option => [option.value, option.label] as const),
          );
          const addedClassIds = nextClassIds.filter(
            cid => !existingClassIds.includes(cid),
          );
          const removedClassIds = existingClassIds.filter(
            cid => !nextClassIds.includes(cid),
          );

          const lines: string[] = [
            'Please review impact before updating fee structure:',
          ];

          if (componentsChanged) {
            lines.push(
              '• Fee components have been modified. Updated component breakdown will reflect on linked student fees.',
            );
          }

          if (amountChanged) {
            lines.push(
              oldAmount < newAmount
                ? `• Total fee increased from ₹${oldAmount.toLocaleString('en-IN')} to ₹${newAmount.toLocaleString('en-IN')}. Student balances will increase.`
                : `• Total fee decreased from ₹${oldAmount.toLocaleString('en-IN')} to ₹${newAmount.toLocaleString('en-IN')}. Student balances will reduce (overpaid students may show negative balance).`,
            );
          }

          if (classesChanged) {
            if (addedClassIds.length > 0) {
              lines.push(
                `• Added classes: ${addedClassIds.map(cid => optionMap.get(cid) ?? cid).join(', ')}`,
              );
            }
            if (removedClassIds.length > 0) {
              lines.push(
                `• Removed classes: ${removedClassIds.map(cid => optionMap.get(cid) ?? cid).join(', ')}`,
              );
            }

            try {
              const impact = await fetchClassChangeImpact(id, nextClassIds);
              lines.push(...buildImpactLines(impact));
            } catch {
              lines.push(
                '• Could not fetch class change impact preview. Update will still proceed if confirmed.',
              );
            }
          }

          if (amountChanged || componentsChanged) {
            lines.push(
              '• Balance formula: New Total − Discount − Amount Already Paid. Existing payments will not be deleted.',
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
        onSuccess: () => navigation.navigate('FeeStructures'),
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
    navigation,
  ]);

  const handleConfirmImpactUpdate = useCallback(() => {
    if (!pendingPayload) return;
    persistUpdate(pendingPayload);
    setShowImpactConfirm(false);
    setPendingPayload(null);
  }, [pendingPayload, persistUpdate]);

  const totalAmount = components.reduce(
    (s, c) => s + (Number(c.amount) || 0),
    0,
  );
  const toggleDotColor = isActive ? '#059669' : '#94a3b8';

  if (isEditing && isLoadingStructure) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Edit Fee Structure' : 'New Fee Structure'}
        subtitle={
          isEditing ? 'Update structure details' : 'Create a new fee structure'
        }
        colors={['#059669', '#10b981']}
        onBack={handleBack}
      />

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
            style={styles.descriptionInput}
          />
          <AcademicYearDropdown
            value={academicYear}
            onChange={setAcademicYear}
            error={errors.academic_year}
            required
            extraOptions={
              existing?.academic_year_public_id
                ? [
                    {
                      label: existing.academic_year,
                      value: existing.academic_year_public_id,
                    },
                  ]
                : undefined
            }
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
                style={[styles.toggleDot, { backgroundColor: toggleDotColor }]}
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
              {errors.components && (
                <Text style={styles.errorText}>{errors.components}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.addCompBtn} onPress={addComponent}>
              <Plus size={16} color="#059669" />
              <Text style={styles.addCompText}>Add</Text>
            </TouchableOpacity>
          </View>

          {components.map((comp, index) => (
            <FeeComponentRow
              key={comp.key}
              comp={comp}
              index={index}
              canRemove={components.length > 1}
              onUpdate={updateComponent}
              onRemove={removeComponent}
            />
          ))}

          {/* Total */}
          <View style={styles.totalRow}>
            <IndianRupee size={18} color="#059669" />
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </Animated.View>

        {/* Submit */}
        <Animated.View
          entering={FadeInDown.delay(250)}
          style={styles.submitWrap}
        >
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
