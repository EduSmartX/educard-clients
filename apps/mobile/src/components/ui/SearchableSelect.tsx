/**
 * SearchableSelect — reusable single-select dropdown with built-in search.
 * Mirrors the web SearchableSelect: the search box auto-shows once the option
 * count exceeds `showSearchThreshold` (default 5).
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

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  /** Modal header text; falls back to `label` when omitted. Useful when no visible field label is wanted. */
  title?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Show the search box when options exceed this count. */
  showSearchThreshold?: number;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  label,
  title,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  disabled = false,
  loading = false,
  showSearchThreshold = 5,
}: SearchableSelectProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find(o => o.value === value);
  const showSearch = options.length > showSearchThreshold;

  const filtered = useMemo(() => {
    if (!showSearch || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, search, showSearch]);

  const close = () => {
    setVisible(false);
    setSearch('');
  };

  const handleSelect = (val: string) => {
    onValueChange?.(val);
    close();
  };

  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.triggerText, !selectedOption && styles.placeholder]}
          numberOfLines={1}
        >
          {loading ? 'Loading...' : (selectedOption?.label ?? placeholder)}
        </Text>
        <ChevronDown size={18} color="#94a3b8" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={close}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {title ?? label ?? 'Select'}
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
                  autoFocus
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={item => item.value}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => !item.disabled && handleSelect(item.value)}
                    disabled={item.disabled}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                        item.disabled && styles.optionDisabled,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected && <Check size={18} color="#7c3aed" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{emptyText}</Text>
              }
            />
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

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
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
  list: { paddingHorizontal: 8, marginTop: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
  },
  optionSelected: { backgroundColor: '#f5f3ff' },
  optionText: { fontSize: 15, color: '#334155', flex: 1 },
  optionTextSelected: { color: '#7c3aed', fontWeight: '600' },
  optionDisabled: { color: '#cbd5e1' },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
    paddingVertical: 24,
  },
});
