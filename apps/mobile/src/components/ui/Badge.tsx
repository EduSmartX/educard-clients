/**
 * Badge Component
 */

import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  text?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  primary: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    dot: 'bg-primary-500',
  },
  secondary: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-700',
    dot: 'bg-secondary-500',
  },
  success: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    dot: 'bg-success-500',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    dot: 'bg-warning-500',
  },
  danger: {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    dot: 'bg-danger-500',
  },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string; dot: string }> = {
  sm: {
    container: 'px-2 py-0.5',
    text: 'text-xs',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    container: 'px-2.5 py-1',
    text: 'text-sm',
    dot: 'w-2 h-2',
  },
  lg: {
    container: 'px-3 py-1.5',
    text: 'text-base',
    dot: 'w-2.5 h-2.5',
  },
};

export function Badge({
  text,
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const content = text ?? children;

  return (
    <View className={`flex-row items-center rounded-full ${styles.bg} ${sizes.container} `}>
      {dot && <View className={`mr-1.5 rounded-full ${styles.dot} ${sizes.dot} `} />}
      <Text className={`font-medium ${styles.text} ${sizes.text}`}>{content}</Text>
    </View>
  );
}

export default Badge;
