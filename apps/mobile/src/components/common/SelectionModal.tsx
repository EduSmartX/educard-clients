/**
 * Generic Selection Modal Components
 * Reusable modal patterns for single-select and multi-select functionality
 * Eliminates code duplication across preference modals, pickers, etc.
 */

import { Colors } from '@educard/shared';
import { Check } from 'lucide-react-native';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

// --- Base Modal Wrapper ---

interface BaseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function BaseSelectionModal({
  visible,
  onClose,
  title,
  children,
  footer,
}: Readonly<BaseSelectionModalProps>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalList}>{children}</ScrollView>
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
      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
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

interface SingleSelectModalProps<T extends SingleSelectOption = SingleSelectOption> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: T[];
  selectedValue: string;
  onSelect: (value: string, option: T) => void;
  formatLabel?: (option: T) => string;
}

export function SingleSelectModal<T extends SingleSelectOption = SingleSelectOption>({
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
      {options.map((option) => (
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

interface MultiSelectModalProps<T extends SingleSelectOption = SingleSelectOption> {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: T[];
  selectedValues: string[];
  onToggle: (value: string, option: T) => void;
  onSave?: (selectedValues: string[]) => void;
  formatLabel?: (option: T) => string;
  saveButtonText?: string;
}

export function MultiSelectModal<T extends SingleSelectOption = SingleSelectOption>({
  visible,
  onClose,
  title,
  options,
  selectedValues,
  onToggle,
  onSave,
  formatLabel,
  saveButtonText,
}: Readonly<MultiSelectModalProps<T>>) {
  const handleSave = () => {
    onSave?.(selectedValues);
    onClose();
  };

  const footer = onSave ? (
    <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
      <Text style={styles.modalSaveBtnText}>
        {saveButtonText || `Save (${selectedValues.length} selected)`}
      </Text>
    </TouchableOpacity>
  ) : undefined;

  return (
    <BaseSelectionModal visible={visible} onClose={onClose} title={title} footer={footer}>
      {options.map((option) => (
        <SelectionOption
          key={option.value}
          label={formatLabel ? formatLabel(option) : option.label}
          isSelected={selectedValues.includes(option.value)}
          onPress={() => onToggle(option.value, option)}
          showCheckbox
        />
      ))}
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
