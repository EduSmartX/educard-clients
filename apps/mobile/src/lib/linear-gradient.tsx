/**
 * LinearGradient wrapper.
 * Drop-in for `import { LinearGradient } from 'expo-linear-gradient'` used across
 * ported screens — backed by react-native-linear-gradient. Accepts readonly color
 * tuples (expo-style) and forwards a mutable array to the native component.
 */

import React from 'react';
import RNLinearGradient from 'react-native-linear-gradient';

type RNProps = React.ComponentProps<typeof RNLinearGradient>;

export type LinearGradientProps = Omit<RNProps, 'colors' | 'locations'> & {
  colors: readonly (string | number)[];
  locations?: readonly number[];
};

export function LinearGradient({
  colors,
  locations,
  ...props
}: LinearGradientProps) {
  return (
    <RNLinearGradient
      colors={[...colors]}
      locations={locations ? [...locations] : undefined}
      {...props}
    />
  );
}

export default LinearGradient;
