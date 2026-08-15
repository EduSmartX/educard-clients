/**
 * SearchableMultiSelect — reusable multi-select dropdown with built-in search.
 * Mirrors the web MultiSelect: the search box auto-shows once the option count
 * exceeds `showSearchThreshold` (default 5).
 */

import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SearchableMultiSelectOption {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Show the search box when options exceed this count. */
  showSearchThreshold?: number;
}

export function SearchableMultiSelect({
  options,
  value = [],
  onChange,
  label,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  disabled = false,
  loading = false,
  showSearchThreshold = 5,
}: SearchableMultiSelectProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const showSearch = options.length > showSearchThreshold;

  const filtered = useMemo(() => {
    if (!showSearch || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search, showSearch]);

  const selectedLabels = useMemo(
    () => options.filter(o => value.includes(o.value)).map(o => o.label),
    [options, value],
  );

  const close = () => {
    setVisible(false);
    setSearch('');
  };

  const toggleItem = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeItem = (val: string) => onChange(value.filter(v => v !== val));

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : `${selectedLabels.length} selected`;

  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            selectedLabels.length === 0 && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {loading ? 'Loading...' : displayText}
        </Text>
        <ChevronDown size={18} color="#94a3b8" />
      </TouchableOpacity>

      {selectedLabels.length > 0 && (
        <View style={styles.chipsRow}>
          {options
            .filter(o => value.includes(o.value))
            .map(o => (
              <View key={o.value} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {o.label}
                </Text>
                <TouchableOpacity
                  onPress={() => removeItem(o.value)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#7c3aed" />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={close}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <View style={[styles.modal, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label ?? 'Select'}</Text>
              <Text style={styles.modalCount}>
                {value.length} of {options.length} selected
              </Text>
              <TouchableOpacity onPress={close} hitSlop={12}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.searchRow}>
                <Search size={16} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => onChange(options.map(o => o.value))}
              >
                <Text style={styles.quickBtnText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => onChange([])}
              >
                <Text style={styles.quickBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={item => item.value}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = value.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => toggleItem(item.value)}
                    activeOpacity={0.6}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxSelected,
                      ]}
                    >
                      {selected && <Check size={14} color="#fff" />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{emptyMessage}</Text>
              }
            />

            <TouchableOpacity style={styles.doneBtn} onPress={close}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  triggerDisabled: { opacity: 0.5 },
  triggerText: { fontSize: 15, color: '#1e293b', flex: 1 },
  placeholder: { color: '#94a3b8' },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
    flexShrink: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1 },
  modalCount: { fontSize: 12, color: '#94a3b8' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', padding: 0 },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  list: { paddingHorizontal: 8, marginTop: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  optionSelected: { backgroundColor: '#f5f3ff' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  optionText: { fontSize: 15, color: '#334155', flex: 1 },
  optionTextSelected: { color: '#7c3aed', fontWeight: '600' },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    paddingVertical: 24,
  },
  doneBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
