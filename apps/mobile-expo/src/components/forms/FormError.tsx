/**
 * FormError - Displays API / submission errors as a banner
 */

import { AlertCircle, X } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FormErrorProps {
  message: string | null | undefined;
  onDismiss?: () => void;
}

export function FormError({ message, onDismiss }: FormErrorProps) {
  if (!message) return null;

  return (
    <View style={styles.banner}>
      <AlertCircle size={18} color="#dc2626" />
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
          <X size={16} color="#dc2626" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  text: { flex: 1, fontSize: 14, color: '#dc2626', fontWeight: '500' },
  dismiss: { padding: 2 },
});
