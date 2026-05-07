/**
 * FormDropdown - Modal picker for selecting from a list
 * Used for class master, blood group, class teacher, etc.
 */

import { ChevronDown, Search, X, Check, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TextInput } from 'react-native';

interface Option {
  value: string;
  label: string;
}

interface FormDropdownProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function FormDropdown({
  label,
  options,
  value,
  onChange,
  error,
  required,
  placeholder = 'Select...',
  searchable = false,
  disabled,
  loading,
}: FormDropdownProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const filtered =
    searchable && search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

  const handleSelect = (val: string) => {
    onChange(val);
    setVisible(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedLabel && styles.placeholder]}>
          {loading ? 'Loading...' : (selectedLabel ?? placeholder)}
        </Text>
        <ChevronDown size={18} color={error ? '#ef4444' : '#94a3b8'} />
      </TouchableOpacity>
      {error && (
        <View style={styles.errorRow}>
          <AlertCircle size={13} color="#ef4444" />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {visible && (
        <Modal visible={visible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {searchable && (
                <View style={styles.searchBox}>
                  <Search size={18} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search..."
                    placeholderTextColor="#94a3b8"
                    autoFocus
                  />
                </View>
              )}

              <FlatList
                data={filtered}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => {
                  const selected = item.value === value;
                  return (
                    <TouchableOpacity
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => handleSelect(item.value)}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {item.label}
                      </Text>
                      {selected && <Check size={18} color="#7c3aed" />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={styles.empty}>No options found</Text>}
              />

              {value ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    onChange('');
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={styles.clearText}>Clear Selection</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  labelError: { color: '#dc2626' },
  required: { color: '#ef4444' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#f8fafc',
  },
  triggerError: { borderColor: '#ef4444', backgroundColor: '#fef2f2', borderWidth: 2 },
  triggerDisabled: { opacity: 0.5 },
  triggerText: { fontSize: 15, color: '#1e293b', flex: 1 },
  placeholder: { color: '#94a3b8' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 4 },
  error: { fontSize: 12, color: '#ef4444', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 4 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  optionSelected: { backgroundColor: '#f5f3ff' },
  optionText: { fontSize: 15, color: '#334155' },
  optionTextSelected: { color: '#7c3aed', fontWeight: '600' },
  empty: { padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 15 },
  clearBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  clearText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});
