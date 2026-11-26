/**
 * "Whole school" or "Specific classes" (searchable multi-select, one entry per grade).
 * Used for ID card designs, product photos and class differences.
 */
import { School, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MultiSelectModal } from '@/components/common/SelectionModal';
import { useClasses } from '@/features/classes';

import { classLabel } from '../utils/store-format';
import { ORDER_COLOURS, PickerButton } from './OrderParts';

export interface ClassScope {
  wholeSchool: boolean;
  /** One section public ID per chosen grade. */
  classIds: string[];
}

export const WHOLE_SCHOOL_SCOPE: ClassScope = {
  wholeSchool: true,
  classIds: [],
};

export function isScopeComplete(scope: ClassScope): boolean {
  return scope.wholeSchool || scope.classIds.length > 0;
}

/** Class IDs for the API; empty = whole school. */
export function scopeClassIds(scope: ClassScope): string[] {
  return scope.wholeSchool ? [] : scope.classIds;
}

/** One option per grade ("Class 5"), valued by any one of its sections. */
export function useGradeOptions() {
  const { data } = useClasses({ page_size: 100 });
  return useMemo(() => {
    const byGrade = new Map<
      string,
      { value: string; label: string; gradeId?: number }
    >();
    for (const section of data?.classes ?? []) {
      const label = section.class_master?.name ?? classLabel(section);
      if (!byGrade.has(label)) {
        byGrade.set(label, {
          value: section.public_id,
          label,
          gradeId: section.class_master?.id,
        });
      }
    }
    return Array.from(byGrade.values());
  }, [data]);
}

interface ClassScopePickerProps {
  value: ClassScope;
  onChange: (value: ClassScope) => void;
  /** Only classes (no "Whole school" choice). */
  classesOnly?: boolean;
}

export function ClassScopePicker({
  value,
  onChange,
  classesOnly = false,
}: ClassScopePickerProps) {
  const options = useGradeOptions();
  const [open, setOpen] = useState(false);
  const chosen = options.filter(option =>
    value.classIds.includes(option.value),
  );

  const pill = (
    selected: boolean,
    onPress: () => void,
    Icon: typeof School,
    label: string,
  ) => (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Icon
        size={14}
        color={selected ? ORDER_COLOURS.accentText : ORDER_COLOURS.muted}
      />
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      {!classesOnly && (
        <View style={styles.row}>
          {pill(
            value.wholeSchool,
            () => onChange({ ...value, wholeSchool: true }),
            School,
            'Whole school',
          )}
          {pill(
            !value.wholeSchool,
            () => onChange({ ...value, wholeSchool: false }),
            Users,
            'Specific classes',
          )}
        </View>
      )}
      {(classesOnly || !value.wholeSchool) && (
        <>
          <PickerButton
            label={
              chosen.length > 0
                ? chosen.map(option => option.label).join(', ')
                : ''
            }
            placeholder="Search and select classes"
            onPress={() => setOpen(true)}
          />
          <MultiSelectModal
            visible={open}
            onClose={() => setOpen(false)}
            title="Select classes"
            options={options}
            selectedValues={value.classIds}
            onToggle={classId =>
              onChange({
                wholeSchool: false,
                classIds: value.classIds.includes(classId)
                  ? value.classIds.filter(id => id !== classId)
                  : [...value.classIds, classId],
              })
            }
            onSave={() => undefined}
            saveButtonText={`Done (${value.classIds.length} selected)`}
            searchable
            searchPlaceholder="Class name"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pillSelected: {
    borderColor: ORDER_COLOURS.accent,
    backgroundColor: ORDER_COLOURS.accentSoft,
  },
  pillText: { fontSize: 13, color: '#374151' },
  pillTextSelected: { color: ORDER_COLOURS.accentText, fontWeight: '600' },
});
