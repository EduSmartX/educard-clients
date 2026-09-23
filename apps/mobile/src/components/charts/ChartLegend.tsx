/**
 * ChartLegend - reusable legend for chart segments.
 */

import { Colors } from '@educard/shared';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { ChartSegment } from './types';

interface ChartLegendProps {
  data: ChartSegment[];
  showValues?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ChartLegend({
  data,
  showValues = false,
  style,
}: ChartLegendProps) {
  return (
    <View style={[styles.container, style]}>
      {data.map(item => (
        <View key={item.label} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          {showValues && <Text style={styles.value}>{item.value}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 4, marginRight: 8 },
  label: { flex: 1, fontSize: 13, color: Colors.gray[600] },
  value: { fontSize: 15, fontWeight: '700', color: Colors.gray[900] },
});
