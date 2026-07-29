/**
 * Drop-in replacement for expo-linear-gradient
 * Uses a plain View with the first color as background
 * to avoid TurboModule crash in Expo Go
 */

import React from 'react';
import { View, type ViewStyle, type ViewProps } from 'react-native';

interface LinearGradientProps extends ViewProps {
  colors: readonly string[];
  start?: { x: number; y: number } | readonly [number, number];
  end?: { x: number; y: number } | readonly [number, number];
  locations?: readonly number[];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  style,
  children,
  start: _start,
  end: _end,
  locations: _locations,
  ...rest
}) => {
  // Use the first color as a solid background fallback
  const backgroundColor = colors?.[0] || 'transparent';
  return (
    <View style={[{ backgroundColor }, style]} {...rest}>
      {children}
    </View>
  );
};

export default LinearGradient;
