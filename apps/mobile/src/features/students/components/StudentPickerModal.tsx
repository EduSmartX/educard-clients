/**
 * Pick students from one or more classes: a search box (searched on the server by name,
 * roll number or admission number), results grouped by class, and the chosen students
 * kept while the search changes. Same behaviour as the web StudentMultiPicker.
 *
 * Reusable: give it the class IDs to pick from and keep the chosen students in state.
 */
import { useDebounce, type Student } from '@educard/shared';
import { useQuery } from '@tanstack/react-query';
import { Check, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getStudents } from '../api/students-api';

export function studentClassLabel(student: Student): string {
  return [student.class_info?.class_master_name, student.class_info?.name]
    .filter(Boolean)
    .join(' - ');
}

interface StudentPickerModalProps {
  visible: boolean;
  onClose: () => void;
  /** Class section public IDs to pick from. */
  classIds: string[];
  value: Student[];
  onChange: (students: Student[]) => void;
  title?: string;
}

type Row =
  | { type: 'header'; label: string }
  | { type: 'student'; student: Student };

export function StudentPickerModal({
  visible,
  onClose,
  classIds,
  value,
  onChange,
  title = 'Choose students',
}: StudentPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const params = {
    class_id: classIds.join(','),
    search: debounced.trim() || undefined,
    page_size: 50,
    embed_images: false,
  };
  const query = useQuery({
    queryKey: ['students', 'picker', params],
    queryFn: () => getStudents(params),
    enabled: visible && classIds.length > 0,
    staleTime: 60 * 1000,
  });
  const results = useMemo(() => query.data?.data ?? [], [query.data]);
  const total = query.data?.pagination.count ?? 0;

  const chosen = useMemo(
    () => new Set(value.map(student => student.public_id)),
    [value],
  );
  const showClass = classIds.length > 1;
  const rows: Row[] = useMemo(() => {
    if (!showClass) {
      return results.map(student => ({ type: 'student' as const, student }));
    }
    const groups = new Map<string, Student[]>();
    for (const student of results) {
      const label = studentClassLabel(student);
      groups.set(label, [...(groups.get(label) ?? []), student]);
    }
    return Array.from(groups).flatMap(([label, students]) => [
      { type: 'header' as const, label },
      ...students.map(student => ({ type: 'student' as const, student })),
    ]);
  }, [results, showClass]);

  const toggle = (student: Student) =>
    onChange(
      chosen.has(student.public_id)
        ? value.filter(item => item.public_id !== student.public_id)
        : [...value, student],
    );
  const unchosenShown = results.filter(
    student => !chosen.has(student.public_id),
  );

  return (
    // A bottom sheet like the app's other pickers (SearchableSelect): it stays clear of
    // the status bar and camera cut-out, and Done sits at the bottom within thumb reach.
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={[styles.backdrop, { minHeight: insets.top + 48 }]}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close"
            >
              <X size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Name, roll number or admission number"
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.isFetching ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : null}
          </View>

          <FlatList
            style={styles.list}
            data={rows}
            keyExtractor={(row, index) =>
              row.type === 'header'
                ? `h-${row.label}-${index}`
                : row.student.public_id
            }
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.isLoading ? null : (
                <Text style={styles.empty}>No matching students</Text>
              )
            }
            renderItem={({ item }) =>
              item.type === 'header' ? (
                <Text style={styles.group}>{item.label}</Text>
              ) : (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => toggle(item.student)}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: chosen.has(item.student.public_id),
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      chosen.has(item.student.public_id) && styles.checkboxOn,
                    ]}
                  >
                    {chosen.has(item.student.public_id) ? (
                      <Check size={14} color="#fff" />
                    ) : null}
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.student.full_name}
                  </Text>
                  {item.student.roll_number ? (
                    <Text style={styles.roll}>
                      Roll {item.student.roll_number}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )
            }
          />

          <View style={styles.footer}>
            <Text style={styles.count}>
              {total > results.length
                ? `Showing ${results.length} of ${total}. Search to narrow down.`
                : `${value.length} selected`}
            </Text>
            <View style={styles.footerButtons}>
              {unchosenShown.length > 0 ? (
                <TouchableOpacity
                  style={styles.footerButton}
                  onPress={() => onChange([...value, ...unchosenShown])}
                >
                  <Text style={styles.footerButtonText}>
                    Select {unchosenShown.length} shown
                  </Text>
                </TouchableOpacity>
              ) : null}
              {value.length > 0 ? (
                <TouchableOpacity
                  style={styles.footerButton}
                  onPress={() => onChange([])}
                >
                  <Text style={styles.footerButtonText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text style={styles.doneButtonText}>
                {value.length > 0
                  ? `Done · ${value.length} student${
                      value.length === 1 ? '' : 's'
                    }`
                  : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { flexGrow: 1 },
  sheet: {
    height: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
  },
  doneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  list: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 12, color: '#111827' },
  group: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  name: { flex: 1, fontSize: 15, color: '#111827' },
  roll: { fontSize: 13, color: '#6b7280' },
  empty: { textAlign: 'center', padding: 24, fontSize: 14, color: '#6b7280' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  count: { fontSize: 13, color: '#4b5563' },
  footerButtons: { flexDirection: 'row', gap: 10 },
  footerButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  footerButtonText: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
