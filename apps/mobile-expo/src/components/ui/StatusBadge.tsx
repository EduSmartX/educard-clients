/**
 * Generic Status Badge Component
 * Reusable colored pill badge for displaying status/mode labels.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ label, color, size = 'md' }: StatusBadgeProps) {
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
