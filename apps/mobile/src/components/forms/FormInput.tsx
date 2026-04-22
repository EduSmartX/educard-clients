/**
 * FormInput - Reusable text input with label, error, required indicator, onBlur validation
 * Highlights with red border + background whenever `error` is set (submit or blur).
 */

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  /** Called on blur with field value — use for per-field validation */
  onBlurValidate?: () => void;
}

export function FormInput({ label, error, required, hint, style, onBlurValidate, onBlur, ...props }: FormInputProps) {
  const [focused, setFocused] = useState(false);

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlurValidate?.();
    onBlur?.(e);
  };

  const hasError = !!error;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, hasError && styles.labelError]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputWrapper, hasError && styles.inputWrapperError, focused && !hasError && styles.inputWrapperFocused]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={handleBlur}
          onFocus={() => setFocused(true)}
          {...props}
        />
      </View>
      {hasError ? (
        <View style={styles.errorRow}>
          <AlertCircle size={13} color="#ef4444" />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  labelError: { color: '#dc2626' },
  required: { color: '#ef4444' },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    borderWidth: 2,
  },
  inputWrapperFocused: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf5ff',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 4 },
  error: { fontSize: 12, color: '#ef4444', flex: 1 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 4 },
});
