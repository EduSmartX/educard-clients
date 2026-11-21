/**
 * Students of one class section, for ordering per person: tick who gets an item
 * (one ID card each) and, for uniform-style products, set each one's sizes.
 */
import type { ProductAttribute, Student } from '@educard/shared';
import { CheckSquare, Eye, ImageOff, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useStudents } from '@/features/students';

import type { StudentSelection } from '../utils/store-format';
import { AttributeInput } from './AttributeInput';
import { storeStyles as s } from './store-styles';

interface StudentSelectListProps {
  classPublicId: string;
  selection: StudentSelection;
  onChange: (selection: StudentSelection) => void;
  /** Per-student values, e.g. shirt size and waist. Empty for ID cards. */
  attributes?: ProductAttribute[];
  /** ID cards: flag missing photos and offer a per-student preview. */
  showPhotoStatus?: boolean;
  previewStudent?: string;
  onPreview?: (student: Student) => void;
}

export function StudentSelectList({
  classPublicId,
  selection,
  onChange,
  attributes = [],
  showPhotoStatus = false,
  previewStudent,
  onPreview,
}: StudentSelectListProps) {
  const [search, setSearch] = useState('');
  const [fillAll, setFillAll] = useState<Record<string, string>>({});
  const { data, isLoading } = useStudents({
    class_id: classPublicId,
    page_size: 100,
    embed_images: false,
  });
  const students = useMemo(() => data?.students ?? [], [data]);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return students;
    }
    return students.filter(student =>
      [student.full_name, student.roll_number, student.admission_number]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term)),
    );
  }, [students, search]);

  if (isLoading) {
    return <ActivityIndicator color="#2563eb" style={styles.loading} />;
  }
  if (students.length === 0) {
    return <Text style={s.hint}>No students in this class yet.</Text>;
  }

  const selectedCount = Object.keys(selection).length;
  const allSelected = visible.every(student => student.public_id in selection);

  const toggle = (studentId: string) => {
    const next = { ...selection };
    if (studentId in next) {
      delete next[studentId];
    } else {
      next[studentId] = { ...fillAll };
    }
    onChange(next);
  };

  const toggleAll = () => {
    const next = { ...selection };
    for (const student of visible) {
      if (allSelected) {
        delete next[student.public_id];
      } else {
        next[student.public_id] = next[student.public_id] ?? { ...fillAll };
      }
    }
    onChange(next);
  };

  const setValue = (studentId: string, code: string, value: string) => {
    onChange({
      ...selection,
      [studentId]: { ...(selection[studentId] ?? {}), [code]: value },
    });
  };

  /** One value for everyone ticked (and anyone ticked later). */
  const applyToAll = (code: string, value: string) => {
    setFillAll(current => ({ ...current, [code]: value }));
    const next: StudentSelection = {};
    for (const [studentId, values] of Object.entries(selection)) {
      next[studentId] = { ...values, [code]: value };
    }
    onChange(next);
  };

  return (
    <View>
      <TextInput
        style={s.input}
        placeholder="Search name or roll number"
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.row} onPress={toggleAll}>
          {allSelected ? (
            <CheckSquare size={18} color="#2563eb" />
          ) : (
            <Square size={18} color="#6b7280" />
          )}
          <Text style={styles.toolbarText}>Select all</Text>
        </TouchableOpacity>
        <Text style={s.hint}>
          {selectedCount} of {students.length} selected
        </Text>
      </View>

      {attributes.length > 0 && selectedCount > 1 && (
        <View style={styles.fillAll}>
          <Text style={s.label}>Set for all selected</Text>
          {attributes.map(attribute => (
            <View key={attribute.code} style={styles.attribute}>
              <Text style={s.hint}>{attribute.display_name}</Text>
              <AttributeInput
                compact
                attribute={attribute}
                value={fillAll[attribute.code] ?? ''}
                onChange={value => applyToAll(attribute.code, value)}
              />
            </View>
          ))}
        </View>
      )}

      {visible.map(student => {
        const selected = student.public_id in selection;
        const values = selection[student.public_id] ?? {};
        const missingPhoto =
          showPhotoStatus &&
          !student.profile_photo_url &&
          !student.profile_photo_thumbnail;
        return (
          <View
            key={student.public_id}
            style={[
              styles.student,
              selected && styles.studentSelected,
              previewStudent === student.public_id && styles.studentPreviewed,
            ]}
          >
            <View style={styles.studentRow}>
              <TouchableOpacity
                style={[styles.row, styles.studentName]}
                onPress={() => toggle(student.public_id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                {selected ? (
                  <CheckSquare size={20} color="#2563eb" />
                ) : (
                  <Square size={20} color="#6b7280" />
                )}
                <View style={styles.studentText}>
                  <Text style={styles.name}>{student.full_name}</Text>
                  <View style={styles.row}>
                    {student.roll_number ? (
                      <Text style={s.hint}>Roll {student.roll_number}</Text>
                    ) : null}
                    {missingPhoto && (
                      <View style={styles.row}>
                        <ImageOff size={12} color="#d97706" />
                        <Text style={styles.noPhoto}>No photo</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              {onPreview && (
                <TouchableOpacity
                  onPress={() => onPreview(student)}
                  accessibilityLabel={`Preview ${student.full_name}'s card`}
                  hitSlop={8}
                >
                  <Eye size={20} color="#2563eb" />
                </TouchableOpacity>
              )}
            </View>

            {selected &&
              attributes.map(attribute => (
                <View key={attribute.code} style={styles.attribute}>
                  <Text style={s.hint}>
                    {attribute.display_name}
                    {attribute.is_required ? ' *' : ''}
                  </Text>
                  <AttributeInput
                    compact
                    attribute={attribute}
                    value={values[attribute.code] ?? ''}
                    onChange={value =>
                      setValue(student.public_id, attribute.code, value)
                    }
                  />
                </View>
              ))}
          </View>
        );
      })}

      {(data?.totalCount ?? 0) > students.length && (
        <Text style={s.hint}>
          Showing the first {students.length} of {data?.totalCount} students.
          Add another line for the rest.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  toolbarText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  fillAll: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  student: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  studentSelected: { backgroundColor: '#f8fbff' },
  studentPreviewed: { backgroundColor: '#eff6ff' },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentName: { flex: 1 },
  studentText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  noPhoto: { fontSize: 11, color: '#d97706' },
  attribute: { marginTop: 8, marginLeft: 26, gap: 4 },
});
