/**
 * StatsGrid Component
 * Responsive grid layout for stat cards on dashboards.
 */

import { View, StyleSheet } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

import { StatCard, type StatCardData } from './StatCard';

export interface StatsGridProps {
  stats: StatCardData[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { statColumns, horizontalPadding } = useResponsive();

  const rows: StatCardData[][] = [];
  for (let i = 0; i < stats.length; i += statColumns) {
    rows.push(stats.slice(i, i + statColumns));
  }

  return (
    <View style={[styles.grid, { paddingHorizontal: horizontalPadding }]}>
      {rows.map((row, rowIndex) => (
        <View key={row[0]?.id ?? `row-${rowIndex}`} style={styles.row}>
          {row.map((stat, index) => (
            <View
              key={stat.id || `stat-${rowIndex}-${index}`}
              style={styles.cell}
            >
              <StatCard
                {...stat}
                animationIndex={rowIndex * statColumns + index}
              />
            </View>
          ))}
          {row.length < statColumns &&
            Array.from({ length: statColumns - row.length }).map((_, i) => (
              <View key={`empty-${rowIndex}-${i}`} style={styles.cell} />
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
