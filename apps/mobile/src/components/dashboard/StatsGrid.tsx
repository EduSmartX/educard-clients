/**
 * StatsGrid Component
 * Grid layout for stat cards on dashboards
 */

import { View, StyleSheet } from 'react-native';

import { StatCard, type StatCardProps } from './StatCard';

export interface StatsGridProps {
  /** Array of stat card configurations */
  stats: StatCardProps[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => (
        <StatCard key={stat.id} {...stat} animationIndex={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
});
