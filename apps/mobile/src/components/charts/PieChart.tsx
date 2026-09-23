/**
 * PieChart - reusable SVG solid pie chart.
 */

import { Colors } from '@educard/shared';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { ChartSegment } from './types';

interface PieChartProps {
  data: ChartSegment[];
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function PieChart({ data, size = 160 }: PieChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const active = data.filter(d => d.value > 0);

  let angle = 0;
  const slices = active.map(d => {
    const sweep = (d.value / total) * 360;
    const path = describeSlice(cx, cy, r, angle, angle + sweep);
    angle += sweep;
    return { key: d.label, path, color: d.color };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {total <= 0 && <Circle cx={cx} cy={cy} r={r} fill={Colors.gray[100]} />}
        {total > 0 && active.length === 1 && (
          <Circle cx={cx} cy={cy} r={r} fill={active[0].color} />
        )}
        {total > 0 &&
          active.length > 1 &&
          slices.map(s => <Path key={s.key} d={s.path} fill={s.color} />)}
      </Svg>
    </View>
  );
}
