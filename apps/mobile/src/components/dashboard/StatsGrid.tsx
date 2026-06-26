/**
 * StatsGrid Component
 * Responsive grid layout for stat cards on dashboards.
 * Shows 2 columns on phones, 4 on tablets.
 */

import { View, StyleSheet } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

import { StatCard, type StatCardProps } from './StatCard';

export interface StatsGridProps {
  /** Array of stat card configurations */
  stats: StatCardProps[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { statColumns, horizontalPadding } = useResponsive();

  // Group stats into rows
  const rows: StatCardProps[][] = [];
  for (let i = 0; i < stats.length; i += statColumns) {
    rows.push(stats.slice(i, i + statColumns));
  }

  return (
    <View style={[styles.grid, { paddingHorizontal: horizontalPadding }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((stat, index) => (
            <View key={stat.id || index} style={styles.cell}>
              <StatCard {...stat} animationIndex={rowIndex * statColumns + index} />
            </View>
          ))}
          {/* Fill empty cells to maintain alignment */}
          {row.length < statColumns &&
            Array.from({ length: statColumns - row.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.cell} />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cell: {
    flex: 1,
  },
});
