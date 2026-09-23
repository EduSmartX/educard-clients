/**
 * FormPhoneInput - FormInput specialized for phone fields, with a "pick from contacts"
 * button that opens the device contact picker and fills the field with the chosen number.
 */

import { Contact } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ContactPickerModal } from './ContactPickerModal';
import { FormInput, type FormInputProps } from './FormInput';

interface FormPhoneInputProps extends Omit<FormInputProps, 'rightSlot'> {
  /** Called with the chosen (or typed) number. */
  onChangeText: (value: string) => void;
  /** Show the "pick from contacts" button (default true). */
  enableContactPicker?: boolean;
}

export function FormPhoneInput({
  enableContactPicker = true,
  onChangeText,
  ...props
}: FormPhoneInputProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const showPicker = enableContactPicker && props.editable !== false;

  return (
    <>
      <FormInput
        {...props}
        onChangeText={onChangeText}
        rightSlot={
          showPicker ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Pick from contacts"
            >
              <Contact size={20} color="#7c3aed" />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ContactPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={onChangeText}
      />
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: { paddingHorizontal: 12, paddingVertical: 10 },
});
