/**
 * BarChart - reusable vertical bar chart (RN views, no SVG needed).
 */

import { Colors } from '@educard/shared';
import { View, Text, StyleSheet } from 'react-native';

import type { BarDatum } from './types';

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  showValues?: boolean;
}

export function BarChart({
  data,
  height = 160,
  color = Colors.primary[500],
  showValues = true,
}: BarChartProps) {
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <View style={styles.container}>
      {data.map(d => {
        const barHeight = Math.max(2, (d.value / max) * height);
        return (
          <View key={d.label} style={styles.col}>
            {showValues && <Text style={styles.value}>{d.value}</Text>}
            <View style={[styles.track, { height }]}>
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: d.color ?? color },
                ]}
              />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  col: { flex: 1, alignItems: 'center' },
  value: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  track: { width: '60%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  label: { fontSize: 11, color: Colors.gray[500], marginTop: 6 },
});
