/**
 * SubmitButton Component
 * Reusable submit/action button with loading state and consistent styling
 *
 * Usage:
 *   <SubmitButton label="Save" onPress={handleSave} isLoading={saving} />
 *   <SubmitButton label="Delete" variant="danger" onPress={handleDelete} />
 */

import { Colors as _Colors } from '@educard/shared';
import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

interface SubmitButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  color?: string; // Override color
}

const VARIANT_COLORS: Record<ButtonVariant, string> = {
  primary: '#2563eb', // blue-600
  secondary: '#6b7280', // gray-500
  success: '#10b981', // emerald-500
  danger: '#dc2626', // red-600
  warning: '#f59e0b', // amber-500
};

export function SubmitButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  color,
}: SubmitButtonProps) {
  const buttonColor = color ?? VARIANT_COLORS[variant];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: buttonColor },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' && <Icon size={18} color="white" />}
          <Text style={styles.label}>{label}</Text>
          {Icon && iconPosition === 'right' && <Icon size={18} color="white" />}
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * CancelButton Component
 * Secondary button for cancel actions
 */
export function CancelButton({
  label = 'Cancel',
  onPress,
  disabled = false,
  fullWidth = true,
  style,
}: {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.cancelButton,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.cancelLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * ButtonRow Component
 * Layout for cancel + submit button pair
 */
export function ButtonRow({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  isLoading = false,
  submitVariant = 'primary',
  submitIcon,
  submitColor,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isLoading?: boolean;
  submitVariant?: ButtonVariant;
  submitIcon?: LucideIcon;
  submitColor?: string;
}) {
  return (
    <View style={styles.buttonRow}>
      <CancelButton label={cancelLabel} onPress={onCancel} fullWidth={false} style={{ flex: 1 }} />
      <SubmitButton
        label={submitLabel}
        onPress={onSubmit}
        isLoading={isLoading}
        variant={submitVariant}
        icon={submitIcon}
        fullWidth={false}
        color={submitColor}
        style={{ flex: 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
