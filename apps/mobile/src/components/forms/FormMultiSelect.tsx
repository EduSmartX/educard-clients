/**
 * FormMultiSelect - Modal multi-select dropdown with search
 * Used for selecting multiple items like subjects, roles, etc.
 */

import { ChevronDown, Search, X, Check } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';

interface Option {
  value: string;
  label: string;
}

interface FormMultiSelectProps {
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function FormMultiSelect({
  label,
  options,
  value,
  onChange,
  error,
  required,
  placeholder = 'Select items...',
  searchable = true,
  disabled,
  loading,
}: FormMultiSelectProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabels = useMemo(() => {
    return options.filter((o) => value.includes(o.value)).map((o) => o.label);
  }, [options, value]);

  const toggleItem = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeItem = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const displayText =
    selectedLabels.length === 0 ? placeholder : `${selectedLabels.length} selected`;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.inputRow, error && styles.inputError, disabled && styles.inputDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, selectedLabels.length === 0 && styles.placeholder]}>
          {displayText}
        </Text>
        <ChevronDown size={18} color={error ? '#ef4444' : '#94a3b8'} />
      </TouchableOpacity>

      {/* Selected chips */}
      {selectedLabels.length > 0 && (
        <View style={styles.chipsRow}>
          {selectedLabels.map((lbl, idx) => {
            const opt = options.find((o) => o.label === lbl);
            return (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {lbl}
                </Text>
                <TouchableOpacity
                  onPress={() => opt && removeItem(opt.value)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color="#7c3aed" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Text style={styles.modalCount}>
                {value.length} of {options.length} selected
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVisible(false);
                  setSearch('');
                }}
                hitSlop={12}
              >
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            {searchable && (
              <View style={styles.searchRow}>
                <Search size={16} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Quick actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => onChange(options.map((o) => o.value))}
              >
                <Text style={styles.quickBtnText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => onChange([])}>
                <Text style={styles.quickBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Options list */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              style={styles.list}
              renderItem={({ item }) => {
                const selected = value.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => toggleItem(item.value)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No items found</Text>}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setVisible(false);
                  setSearch('');
                }}
              >
                <Text style={styles.doneBtnText}>Done ({value.length} selected)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  required: { color: '#ef4444' },
  labelError: { color: '#dc2626' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2', borderWidth: 2 },
  inputDisabled: { opacity: 0.5 },
  inputText: { flex: 1, fontSize: 15, color: '#1e293b' },
  placeholder: { color: '#94a3b8' },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4, marginLeft: 4 },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#7c3aed', maxWidth: 120 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', flex: 1 },
  modalCount: { fontSize: 13, color: '#7c3aed', fontWeight: '600' },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', padding: 0 },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  quickBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  // List
  list: { paddingHorizontal: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  optionSelected: { backgroundColor: '#f5f3ff' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  optionText: { fontSize: 15, color: '#334155', flex: 1 },
  optionTextSelected: { color: '#7c3aed', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  doneBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
