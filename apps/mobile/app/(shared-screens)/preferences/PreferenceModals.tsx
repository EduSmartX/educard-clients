/**
 * Preference Modals - extracted from preferences/index.tsx
 * Reduces nesting depth and cognitive complexity
 */

import { Colors } from '@educard/shared';
import { Check } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { OrganizationPreference } from '@/features/preferences';
import type { SaturdayOffPattern } from '@/features/holidays/api/holidays-api';

import { formatDropdownValue } from './constants';
import { styles } from './styles';

// --- Single Select Modal ---

interface SingleSelectModalProps {
  pref: OrganizationPreference | null;
  onClose: () => void;
  onSelect: (publicId: string, value: string) => void;
}

export function SingleSelectModal({ pref, onClose, onSelect }: SingleSelectModalProps) {
  if (!pref) return null;
  const options = pref.applicable_values ?? [];
  const currentVal = String(pref.value);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{pref.display_name}</Text>
          <ScrollView style={styles.modalList}>
            {options.map((val) => (
              <SingleSelectOption
                key={val}
                val={val}
                isSelected={val === currentVal}
                onPress={() => {
                  onSelect(pref.public_id, val);
                  onClose();
                }}
              />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SingleSelectOption({
  val,
  isSelected,
  onPress,
}: {
  val: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
        {formatDropdownValue(val)}
      </Text>
      {isSelected && <Check size={18} color="#16a34a" />}
    </TouchableOpacity>
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
  const options = pref.applicable_values ?? [];

  const handleToggle = (val: string) => {
    setValues((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{pref.display_name}</Text>
          <ScrollView style={styles.modalList}>
            {options.map((val) => (
              <MultiSelectOption
                key={val}
                val={val}
                isSelected={values.includes(val)}
                onToggle={handleToggle}
              />
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalSaveBtn}
            onPress={() => {
              onSave(pref.public_id, values.join(','));
              onClose();
            }}
          >
            <Text style={styles.modalSaveBtnText}>Save ({values.length} selected)</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MultiSelectOption({
  val,
  isSelected,
  onToggle,
}: {
  val: string;
  isSelected: boolean;
  onToggle: (val: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
      onPress={() => onToggle(val)}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Check size={12} color="#fff" />}
      </View>
      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
        {formatDropdownValue(val)}
      </Text>
    </TouchableOpacity>
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Saturday Off Pattern</Text>
          <ScrollView style={styles.modalList}>
            {options.map((opt) => {
              const isSelected = currentPattern === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color={Colors.primary[500]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
