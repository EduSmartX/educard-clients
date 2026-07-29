/**
 * FAB (Floating Action Button) Component
 * Reusable floating action button for create/add actions
 *
 * Usage:
 *   <FAB onPress={handleAdd} />
 *   <FAB onPress={handleAdd} icon={Edit3} color="#10b981" />
 */

import { Colors } from '@educard/shared';
import { Plus, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface FABProps {
  onPress: () => void;
  icon?: LucideIcon;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: ViewStyle;
  disabled?: boolean;
}

const SIZES = {
  small: { button: 44, icon: 20 },
  medium: { button: 56, icon: 24 },
  large: { button: 64, icon: 28 },
};

export function FAB({
  onPress,
  icon: Icon = Plus,
  color = Colors.primary[500],
  size = 'medium',
  position = 'bottom-right',
  style,
  disabled = false,
}: FABProps) {
  const sizeConfig = SIZES[size];

  const positionStyle = {
    'bottom-right': { right: 20, bottom: 90 },
    'bottom-left': { left: 20, bottom: 90 },
    'bottom-center': { alignSelf: 'center' as const, bottom: 90 },
  }[position];

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          width: sizeConfig.button,
          height: sizeConfig.button,
          borderRadius: sizeConfig.button / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        positionStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Icon size={sizeConfig.icon} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
