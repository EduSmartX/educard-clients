/**
 * DonutChart - reusable SVG donut/ring chart.
 * Pass `data` segments; optionally render a center value/label or custom content.
 */

import { Colors } from '@educard/shared';
import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import type { ChartSegment } from './types';

interface DonutChartProps {
  data: ChartSegment[];
  size?: number;
  thickness?: number;
  trackColor?: string;
  centerValue?: string | number;
  centerLabel?: string;
  centerContent?: ReactNode;
}

export function DonutChart({
  data,
  size = 168,
  thickness = 24,
  trackColor = Colors.gray[100],
  centerValue,
  centerLabel,
  centerContent,
}: DonutChartProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;
  const arcs =
    total > 0
      ? data
          .filter(s => s.value > 0)
          .map(seg => {
            const dash = (seg.value / total) * circumference;
            const offset = -cumulative;
            cumulative += dash;
            return { key: seg.label, color: seg.color, dash, offset };
          })
      : [];

  const hasCenter =
    centerContent != null || centerValue !== undefined || !!centerLabel;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={thickness}
            fill="none"
          />
          {arcs.map(arc => (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
        </G>
      </Svg>
      {hasCenter && (
        <View style={styles.center} pointerEvents="none">
          {centerContent ?? (
            <>
              {centerValue !== undefined && (
                <Text style={styles.centerValue}>{centerValue}</Text>
              )}
              {!!centerLabel && (
                <Text style={styles.centerLabel}>{centerLabel}</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: { fontSize: 26, fontWeight: '800', color: Colors.gray[900] },
  centerLabel: { fontSize: 11, color: Colors.gray[500], marginTop: 2 },
});
