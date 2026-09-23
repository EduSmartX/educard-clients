/**
 * Preference Modals - extracted from preferences/index.tsx
 * Reduces nesting depth and cognitive complexity
 * Refactored to use generic SelectionModal components
 */

import {
  SingleSelectModal as GenericSingleSelectModal,
  MultiSelectModal as GenericMultiSelectModal,
  type SingleSelectOption,
} from '@/components/common/SelectionModal';
import type { SaturdayOffPattern } from '@/features/holidays/api/holidays-api';
import type { OrganizationPreference } from '@/features/preferences';

import { formatDropdownValue } from './_constants';

// --- Single Select Modal ---

interface SingleSelectModalProps {
  pref: OrganizationPreference | null;
  onClose: () => void;
  onSelect: (publicId: string, value: string) => void;
}

export function SingleSelectModal({
  pref,
  onClose,
  onSelect,
}: SingleSelectModalProps) {
  if (!pref) return null;

  const options: SingleSelectOption[] = (pref.applicable_values ?? []).map(
    val => ({
      value: val,
      label: formatDropdownValue(val),
    }),
  );

  const currentVal = String(pref.value);

  return (
    <GenericSingleSelectModal
      visible
      onClose={onClose}
      title={pref.display_name}
      options={options}
      selectedValue={currentVal}
      onSelect={value => {
        onSelect(pref.public_id, value);
      }}
    />
  );
}

// --- Multi Select Modal ---

interface MultiSelectModalProps {
  pref: OrganizationPreference | null;
  values: string[];
  setValues: (fn: (prev: string[]) => string[]) => void;
  onClose: () => void;
  onSave: (publicId: string, values: string) => void;
}

export function MultiSelectModal({
  pref,
  values,
  setValues,
  onClose,
  onSave,
}: MultiSelectModalProps) {
  if (!pref) return null;

  const options: SingleSelectOption[] = (pref.applicable_values ?? []).map(
    val => ({
      value: val,
      label: formatDropdownValue(val),
    }),
  );

  const handleToggle = (val: string) => {
    setValues(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val],
    );
  };

  const handleSave = () => {
    onSave(pref.public_id, values.join(','));
  };

  return (
    <GenericMultiSelectModal
      visible
      onClose={onClose}
      title={pref.display_name}
      options={options}
      selectedValues={values}
      onToggle={handleToggle}
      onSave={handleSave}
    />
  );
}

// --- Saturday Pattern Modal ---

interface SaturdayModalProps {
  visible: boolean;
  onClose: () => void;
  options: { label: string; value: SaturdayOffPattern }[];
  currentPattern: SaturdayOffPattern | undefined;
  onSelect: (value: SaturdayOffPattern) => void;
}

export function SaturdayPatternModal({
  visible,
  onClose,
  options,
  currentPattern,
  onSelect,
}: SaturdayModalProps) {
  const selectOptions: SingleSelectOption[] = options.map(opt => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <GenericSingleSelectModal
      visible={visible}
      onClose={onClose}
      title="Saturday Off Pattern"
      options={selectOptions}
      selectedValue={currentPattern || ''}
      onSelect={value => onSelect(value as SaturdayOffPattern)}
    />
  );
}
