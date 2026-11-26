/**
 * Generic Selection Modal Components
 * Reusable modal patterns for single-select and multi-select functionality
 * Eliminates code duplication across preference modals, pickers, etc.
 */

import { Colors } from '@educard/shared';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Base Modal Wrapper ---

interface BaseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Pinned above the scrolling list, e.g. a search box. */
  header?: React.ReactNode;
}

function BaseSelectionModal({
  visible,
  onClose,
  title,
  children,
  footer,
  header,
}: Readonly<BaseSelectionModalProps>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          {header}
          <ScrollView
            style={styles.modalList}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- Single Select Option ---

interface SelctionOptionProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  showCheckbox?: boolean;
}

export function SelectionOption({
  label,
  isSelected,
  onPress,
  showCheckbox = false,
}: Readonly<SelctionOptionProps>) {
  return (
    <TouchableOpacity
      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showCheckbox && (
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={12} color="#fff" />}
        </View>
      )}
      <Text
        style={[
          styles.modalOptionText,
          isSelected && styles.modalOptionTextSelected,
        ]}
      >
        {label}
      </Text>
      {!showCheckbox && isSelected && (
        <Check size={18} color={Colors.primary?.[500] || '#16a34a'} />
      )}
    </TouchableOpacity>
  );
}

// --- Single Select Modal ---

export interface SingleSelectOption {
  value: string;
  label: string;
}

interface SingleSelectModalProps<
  T extends SingleSelectOption = SingleSelectOption,
> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: T[];
  selectedValue: string;
  onSelect: (value: string, option: T) => void;
  formatLabel?: (option: T) => string;
}

export function SingleSelectModal<
  T extends SingleSelectOption = SingleSelectOption,
>({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  formatLabel,
}: Readonly<SingleSelectModalProps<T>>) {
  return (
    <BaseSelectionModal visible={visible} onClose={onClose} title={title}>
      {options.map(option => (
        <SelectionOption
          key={option.value}
          label={formatLabel ? formatLabel(option) : option.label}
          isSelected={option.value === selectedValue}
          onPress={() => {
            onSelect(option.value, option);
            onClose();
          }}
        />
      ))}
    </BaseSelectionModal>
  );
}

// --- Multi Select Modal ---

interface MultiSelectModalProps<
  T extends SingleSelectOption = SingleSelectOption,
> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: T[];
  selectedValues: string[];
  onToggle: (value: string, option: T) => void;
  onSave?: (selectedValues: string[]) => void;
  formatLabel?: (option: T) => string;
  saveButtonText?: string;
  /** Show a search box that filters options by label (default: off). */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function MultiSelectModal<
  T extends SingleSelectOption = SingleSelectOption,
>({
  visible,
  onClose,
  title,
  options,
  selectedValues,
  onToggle,
  onSave,
  formatLabel,
  saveButtonText,
  searchable = false,
  searchPlaceholder = 'Search…',
}: Readonly<MultiSelectModalProps<T>>) {
  const [search, setSearch] = useState('');
  const labelOf = (option: T) =>
    formatLabel ? formatLabel(option) : option.label;
  const term = search.trim().toLowerCase();
  const visibleOptions =
    searchable && term
      ? options.filter(option => labelOf(option).toLowerCase().includes(term))
      : options;

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleSave = () => {
    onSave?.(selectedValues);
    handleClose();
  };

  const footer = onSave ? (
    <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
      <Text style={styles.modalSaveBtnText}>
        {saveButtonText || `Save (${selectedValues.length} selected)`}
      </Text>
    </TouchableOpacity>
  ) : undefined;

  return (
    <BaseSelectionModal
      visible={visible}
      onClose={handleClose}
      title={title}
      footer={footer}
      header={
        searchable ? (
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        ) : undefined
      }
    >
      {visibleOptions.map(option => (
        <SelectionOption
          key={option.value}
          label={labelOf(option)}
          isSelected={selectedValues.includes(option.value)}
          onPress={() => onToggle(option.value, option)}
          showCheckbox
        />
      ))}
      {visibleOptions.length === 0 && (
        <Text style={styles.emptyText}>No matches</Text>
      )}
    </BaseSelectionModal>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalList: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    paddingVertical: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: '#f0fdf4',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  modalOptionTextSelected: {
    color: '#16a34a',
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary?.[500] || '#16a34a',
    borderColor: Colors.primary?.[500] || '#16a34a',
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary?.[500] || '#16a34a',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
