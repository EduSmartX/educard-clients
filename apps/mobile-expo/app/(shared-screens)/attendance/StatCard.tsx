/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { View, Text } from 'react-native';

import { styles } from './styles';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
}) {
  const colorStyles: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
    green: { bg: '#dcfce7', iconBg: '#bbf7d0', iconColor: '#16a34a' },
    red: { bg: '#fee2e2', iconBg: '#fecaca', iconColor: '#dc2626' },
    blue: { bg: '#dbeafe', iconBg: '#bfdbfe', iconColor: '#2563eb' },
    teal: { bg: '#ccfbf1', iconBg: '#99f6e4', iconColor: '#0d9488' },
    purple: { bg: '#f3e8ff', iconBg: '#e9d5ff', iconColor: '#9333ea' },
  };
  const c = colorStyles[color] || colorStyles.blue;

  return (
    <View style={[styles.statCard, { backgroundColor: c.bg }]}>
      <View style={styles.statCardContent}>
        <View>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
          {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statCardIconBg, { backgroundColor: c.iconBg }]}>
          <Icon size={24} color={c.iconColor} />
        </View>
      </View>
    </View>
  );
}
