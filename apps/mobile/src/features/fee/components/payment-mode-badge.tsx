/**
 * Payment Mode Badge Component for Mobile
 * Displays payment mode with appropriate styling
 */

import type { PaymentModeType } from '@educard/shared';
import { PaymentMode, PaymentModeLabels } from '@educard/shared';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PaymentModeBadgeProps {
  mode: PaymentModeType;
  size?: 'sm' | 'md' | 'lg';
}

const PaymentModeColors: Record<PaymentModeType, string> = {
  [PaymentMode.CASH]: '#10B981',
  [PaymentMode.CHEQUE]: '#F59E0B',
  [PaymentMode.BANK_TRANSFER]: '#3B82F6',
  [PaymentMode.UPI]: '#8B5CF6',
  [PaymentMode.CARD]: '#EC4899',
  [PaymentMode.ONLINE]: '#06B6D4',
};

export function PaymentModeBadge({ mode, size = 'md' }: PaymentModeBadgeProps) {
  const label = PaymentModeLabels[mode] || mode;
  const color = PaymentModeColors[mode] || '#6B7280';

  const sizeStyles = {
    sm: styles.badgeSm,
    md: styles.badgeMd,
    lg: styles.badgeLg,
  };

  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
  };

  return (
    <View style={[styles.badge, sizeStyles[size], { backgroundColor: `${color}20` }]}>
      <Text style={[styles.text, textSizeStyles[size], { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 14,
  },
});
