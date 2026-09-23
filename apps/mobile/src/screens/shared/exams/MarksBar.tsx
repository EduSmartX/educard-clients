/**
 * MarksBar - horizontal marks progress bar with a pass threshold marker.
 * Shared by the exam marks-overview and student-detail screens.
 */

import React from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';

interface MarksBarProps {
  obtained: number;
  max: number;
  pass: number;
}

export function MarksBar({ obtained, max, pass }: MarksBarProps) {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  const passed = obtained >= pass;
  const barColor = passed ? '#22c55e' : '#ef4444';
  const bgColor = passed ? '#dcfce7' : '#fee2e2';
  const fillWidth: DimensionValue = `${Math.min(pct, 100)}%`;
  const thresholdLeft: DimensionValue = `${(pass / max) * 100}%`;

  return (
    <View style={barStyles.wrap}>
      <View style={[barStyles.track, { backgroundColor: bgColor }]}>
        <View
          style={[
            barStyles.fill,
            { width: fillWidth, backgroundColor: barColor },
          ]}
        />
        {max > 0 && (
          <View style={[barStyles.threshold, { left: thresholdLeft }]} />
        )}
      </View>
      <Text style={[barStyles.label, { color: barColor }]}>
        {obtained}/{max}
      </Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: { height: '100%', borderRadius: 5 },
  threshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  label: { fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'right' },
});
