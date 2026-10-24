/**
 * LinearGradient wrapper.
 * Drop-in for `import { LinearGradient } from 'expo-linear-gradient'` used across
 * ported screens — backed by react-native-linear-gradient. Accepts readonly color
 * tuples (expo-style) and forwards a mutable array to the native component.
 *
 * react-native-linear-gradient has no Fabric component, so on iOS it runs through
 * the legacy interop layer, which mis-sizes the view when it has children (content
 * gets clipped or disappears). To avoid that, the gradient is rendered as a
 * child-less background layer inside a regular View that owns layout and children.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import RNLinearGradient from 'react-native-linear-gradient';

type RNProps = React.ComponentProps<typeof RNLinearGradient>;

export type LinearGradientProps = Omit<RNProps, 'colors' | 'locations'> & {
  colors: readonly (string | number)[];
  locations?: readonly number[];
};

const RADIUS_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderTopStartRadius',
  'borderTopEndRadius',
  'borderBottomStartRadius',
  'borderBottomEndRadius',
] as const;

export function LinearGradient({
  colors,
  locations,
  start,
  end,
  useAngle,
  angle,
  angleCenter,
  style,
  children,
  ...viewProps
}: LinearGradientProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const radiusStyle: ViewStyle = {};
  for (const key of RADIUS_KEYS) {
    if (flat[key] !== undefined) {
      (radiusStyle as Record<string, unknown>)[key] = flat[key];
    }
  }

  return (
    <View style={style} {...viewProps}>
      <RNLinearGradient
        colors={[...colors]}
        locations={locations ? [...locations] : undefined}
        start={start}
        end={end}
        useAngle={useAngle}
        angle={angle}
        angleCenter={angleCenter}
        style={[StyleSheet.absoluteFill, radiusStyle]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export default LinearGradient;
