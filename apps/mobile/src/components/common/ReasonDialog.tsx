/**
 * A confirmation that also asks why (optional or required), e.g. cancelling an order.
 * Works the same on Android and iOS (Alert.prompt is iOS-only).
 */
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ReasonDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  placeholder?: string;
  required?: boolean;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ReasonDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText = 'Keep',
  placeholder = 'Reason (optional)',
  required = false,
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (visible) {
      setReason('');
    }
  }, [visible]);
  const blocked = required && !reason.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={500}
          />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.secondary}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.secondaryText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primary,
                destructive && styles.destructive,
                (blocked || isLoading) && styles.disabled,
              ]}
              disabled={blocked || isLoading}
              onPress={() => onConfirm(reason.trim())}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  message: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
  },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondary: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  primary: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#7c3aed',
  },
  destructive: { backgroundColor: '#dc2626' },
  disabled: { opacity: 0.5 },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
