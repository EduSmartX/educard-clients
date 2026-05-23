/**
 * Fee Status Badge Component for Mobile
 * Displays fee status with appropriate styling
 */

import type { FeeStatusType } from '@educard/shared';
import { FeeStatusLabels, FeeStatusColors } from '@educard/shared';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FeeStatusBadgeProps {
  status: FeeStatusType;
  size?: 'sm' | 'md' | 'lg';
}

export function FeeStatusBadge({ status, size = 'md' }: FeeStatusBadgeProps) {
  const label = FeeStatusLabels[status] || status;
  const color = FeeStatusColors[status] || '#6B7280';

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
