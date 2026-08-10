/**
 * LeaveDonutChart - SVG donut chart for leave distribution.
 * Built on react-native-svg (no extra chart dependency).
 */

import { Colors } from '@educard/shared';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface LeaveDonutChartProps {
  segments: DonutSegment[];
  centerValue: string | number;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}

export function LeaveDonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 168,
  strokeWidth = 24,
}: LeaveDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;
  const arcs =
    total > 0
      ? segments
          .filter(s => s.value > 0)
          .map(seg => {
            const dash = (seg.value / total) * circumference;
            const offset = -cumulative;
            cumulative += dash;
            return { key: seg.label, color: seg.color, dash, offset };
          })
      : [];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.gray[100]}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {arcs.map(arc => (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerValue}>{centerValue}</Text>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.gray[900],
  },
  centerLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 2,
  },
});
