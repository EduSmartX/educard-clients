/**
 * Card Component with variants
 */

import React from 'react';
import { View, Text, TouchableOpacity, type ViewProps } from 'react-native';
import { LucideIcon, ChevronRight } from 'lucide-react-native';

import { Colors } from '@/constants/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-lg shadow-secondary-200',
    outlined: 'bg-white border border-secondary-200',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <View
      className={`
        rounded-2xl
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = Colors.primary[500],
  action,
}: CardHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center flex-1">
        {Icon && (
          <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center mr-3">
            <Icon size={20} color={iconColor} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-secondary-900">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-secondary-500 mt-0.5">{subtitle}</Text>
          )}
        </View>
      </View>
      {action}
    </View>
  );
}

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  onPress: () => void;
  showChevron?: boolean;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  iconColor = Colors.primary[500],
  iconBgColor = Colors.primary[50],
  onPress,
  showChevron = true,
}: ActionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-secondary-100"
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: iconBgColor }}
      >
        <Icon size={24} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-secondary-900">{title}</Text>
        {description && (
          <Text className="text-sm text-secondary-500 mt-0.5">{description}</Text>
        )}
      </View>
      {showChevron && (
        <ChevronRight size={20} color={Colors.secondary[400]} />
      )}
    </TouchableOpacity>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = Colors.primary[500],
  iconBgColor = Colors.primary[50],
  trend,
}: StatCardProps) {
  return (
    <Card variant="elevated" className="flex-1 min-w-[140px]">
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon size={20} color={iconColor} />
        </View>
        {trend && (
          <View
            className={`
              px-2 py-1 rounded-full
              ${trend.isPositive ? 'bg-success-50' : 'bg-danger-50'}
            `}
          >
            <Text
              className={`
                text-xs font-medium
                ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}
              `}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-secondary-900">{value}</Text>
      <Text className="text-sm text-secondary-500 mt-1">{title}</Text>
    </Card>
  );
}

export default Card;
