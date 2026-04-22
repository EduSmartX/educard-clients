/**
 * FormSelect - Chip-based selector with label, error highlighting
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function FormSelect({
  label,
  options,
  value,
  onChange,
  error,
  required,
  placeholder,
}: FormSelectProps) {
  const hasError = !!error;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, hasError && styles.labelError]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.chipContainer, hasError && styles.chipContainerError]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.row}>
            {options.map((opt) => {
              const active = value === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onChange(opt.value)}
                  style={[styles.chip, active && styles.chipActive, hasError && !active && styles.chipError]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
      {hasError && (
        <View style={styles.errorRow}>
          <AlertCircle size={13} color="#ef4444" />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  labelError: { color: '#dc2626' },
  required: { color: '#ef4444' },
  chipContainer: {
    padding: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipContainerError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    borderWidth: 2,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipError: {
    borderColor: '#fca5a5',
  },
  chipText: { fontSize: 14, fontWeight: '500', color: '#475569' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 4 },
  error: { fontSize: 12, color: '#ef4444', flex: 1 },
});
