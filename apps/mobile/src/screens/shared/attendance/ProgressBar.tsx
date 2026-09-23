import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { View, Text, type DimensionValue } from 'react-native';

import { styles } from './styles';

export function ProgressBar({
  label,
  present,
  absent,
  halfday,
  total,
  percentage,
  icon: Icon,
  color,
}: {
  label: string;
  present: number;
  absent: number;
  halfday: number;
  total: number;
  percentage: number | null;
  icon: LucideIcon;
  color: string;
}) {
  const colorStyles: Record<string, { primary: string; bg: string }> = {
    blue: { primary: '#2563eb', bg: '#dbeafe' },
    teal: { primary: '#0d9488', bg: '#ccfbf1' },
  };
  const c = colorStyles[color] || colorStyles.blue;
  const progressWidth: DimensionValue = `${percentage || 0}%`;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View style={styles.progressHeaderLeft}>
          <View style={[styles.progressIcon, { backgroundColor: c.bg }]}>
            <Icon size={20} color={c.primary} />
          </View>
          <Text style={styles.progressLabel}>{label}</Text>
        </View>
        <Text style={styles.progressTotal}>{total} Total</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <Text style={[styles.progressPercentage, { color: c.primary }]}>
          {percentage !== null ? `${percentage}%` : '0%'}
        </Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: progressWidth, backgroundColor: c.primary },
          ]}
        />
      </View>

      <View style={styles.progressStats}>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, styles.progressStatDotGreen]} />
          <Text style={styles.progressStatValue}>{present}</Text>
          <Text style={styles.progressStatLabel}>Present</Text>
        </View>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, styles.progressStatDotRed]} />
          <Text style={styles.progressStatValue}>{absent}</Text>
          <Text style={styles.progressStatLabel}>Absent</Text>
        </View>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, styles.progressStatDotAmber]} />
          <Text style={styles.progressStatValue}>{halfday}</Text>
          <Text style={styles.progressStatLabel}>Half Day</Text>
        </View>
        <View style={styles.progressStatItem}>
          <View style={[styles.progressStatDot, styles.progressStatDotGray]} />
          <Text style={styles.progressStatValue}>
            {total - present - absent - halfday}
          </Text>
          <Text style={styles.progressStatLabel}>Unmarked</Text>
        </View>
      </View>
    </View>
  );
}
