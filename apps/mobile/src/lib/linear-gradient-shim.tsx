/**
 * Drop-in replacement for expo-linear-gradient
 * Uses a plain View with the first color as background
 * to avoid TurboModule crash in Expo Go
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number } | [number, number];
  end?: { x: number; y: number } | [number, number];
  locations?: number[];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  [key: string]: any;
}

export function LinearGradient({
  colors,
  style,
  children,
  start,
  end,
  locations,
  ...rest
}: LinearGradientProps) {
  // Use the first color as a solid background fallback
  const backgroundColor = colors?.[0] || 'transparent';
  return (
    <View style={[{ backgroundColor }, style]} {...rest}>
      {children}
    </View>
  );
}

export default LinearGradient;
