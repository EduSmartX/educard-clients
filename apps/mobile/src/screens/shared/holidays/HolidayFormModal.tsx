import { Colors } from '@educard/shared';
import { X } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';

import { FormInput, FormDropdown, FormDatePicker } from '@/components/forms';

import { HOLIDAY_TYPE_OPTIONS } from './constants';
import { styles } from './styles';

interface HolidayFormModalProps {
  visible: boolean;
  isEditing: boolean;
  formData: {
    description: string;
    holiday_type: string;
    start_date: string;
    end_date: string;
  };
  isSaving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeField: (field: string, value: string) => void;
}

export function HolidayFormModal({
  visible,
  isEditing,
  formData,
  isSaving,
  onClose,
  onSubmit,
  onChangeField,
}: HolidayFormModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAwareScrollView
        style={styles.formOverlay}
        contentContainerStyle={styles.formOverlayContent}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>
                {isEditing ? 'Edit Holiday' : 'Add Holiday'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isEditing
                  ? 'Update holiday details'
                  : 'Create a new holiday entry'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.formCloseBtn}>
              <X size={20} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.formFields}>
            <FormInput
              label="Holiday Name"
              required
              value={formData.description}
              onChangeText={v => onChangeField('description', v)}
              placeholder="e.g. Republic Day, Diwali"
            />
            <FormDropdown
              label="Holiday Type"
              required
              options={HOLIDAY_TYPE_OPTIONS}
              value={formData.holiday_type}
              onChange={v => onChangeField('holiday_type', v)}
              placeholder="Select type"
            />
            <FormDatePicker
              label="Start Date"
              required
              value={formData.start_date}
              onChange={v => onChangeField('start_date', v)}
              placeholder="Select start date"
            />
            <FormDatePicker
              label="End Date"
              value={formData.end_date}
              onChange={v => onChangeField('end_date', v)}
              placeholder="Same as start (optional)"
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.formCancelBtn} onPress={onClose}>
              <Text style={styles.formCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formSaveBtn, isSaving && styles.disabledBtn]}
              onPress={onSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.formSaveText}>
                  {isEditing ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
}
