/**
 * Fee Amount Component for Mobile
 * Displays formatted currency amount
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FeeAmountProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'danger' | 'muted';
  showSymbol?: boolean;
}

export function FeeAmount({
  amount,
  size = 'md',
  variant = 'default',
  showSymbol = true,
}: FeeAmountProps) {
  const formattedAmount = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const sizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
    xl: styles.textXl,
  };

  const variantColors = {
    default: '#1F2937',
    success: '#10B981',
    danger: '#EF4444',
    muted: '#6B7280',
  };

  return (
    <Text style={[styles.text, sizeStyles[size], { color: variantColors[variant] }]}>
      {showSymbol && '₹'}
      {formattedAmount}
    </Text>
  );
}

interface FeeProgressProps {
  amountPaid: number;
  totalAmount: number;
  paidPercentage?: number;
  showLabels?: boolean;
}

export function FeeProgress({
  amountPaid,
  totalAmount,
  paidPercentage,
  showLabels = true,
}: FeeProgressProps) {
  const percentage = paidPercentage ?? (totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0);
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const getProgressColor = () => {
    if (clampedPercentage >= 100) return '#10B981';
    if (clampedPercentage >= 50) return '#3B82F6';
    if (clampedPercentage > 0) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.progressContainer}>
      {showLabels && (
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            <FeeAmount amount={amountPaid} size="sm" /> /{' '}
            <FeeAmount amount={totalAmount} size="sm" />
          </Text>
          <Text style={styles.percentageText}>{clampedPercentage.toFixed(1)}%</Text>
        </View>
      )}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${clampedPercentage}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 20,
  },
  textXl: {
    fontSize: 24,
  },
  progressContainer: {
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
});
