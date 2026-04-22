/**
 * Button Component with multiple variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

import { Colors } from '@/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: {
    bg: 'bg-primary-500',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-secondary-100',
    text: 'text-secondary-700',
  },
  outline: {
    bg: 'bg-transparent',
    text: 'text-primary-500',
    border: 'border border-primary-500',
  },
  ghost: {
    bg: 'bg-transparent',
    text: 'text-secondary-600',
  },
  danger: {
    bg: 'bg-danger-500',
    text: 'text-white',
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string; icon: number }> = {
  sm: {
    container: 'px-3 py-2',
    text: 'text-sm',
    icon: 16,
  },
  md: {
    container: 'px-4 py-3',
    text: 'text-base',
    icon: 20,
  },
  lg: {
    container: 'px-6 py-4',
    text: 'text-lg',
    icon: 24,
  },
};

const iconColors: Record<ButtonVariant, string> = {
  primary: Colors.text.inverse,
  secondary: Colors.secondary[700],
  outline: Colors.primary[500],
  ghost: Colors.secondary[600],
  danger: Colors.text.inverse,
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center rounded-xl
        ${styles.bg}
        ${styles.border || ''}
        ${sizes.container}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : 'active:opacity-80'}
        ${className || ''}
      `}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : Colors.primary[500]}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon && iconPosition === 'left' && (
            <Icon size={sizes.icon} color={iconColors[variant]} />
          )}
          <Text
            className={`font-semibold ${styles.text} ${sizes.text}`}
          >
            {title}
          </Text>
          {Icon && iconPosition === 'right' && (
            <Icon size={sizes.icon} color={iconColors[variant]} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default Button;
