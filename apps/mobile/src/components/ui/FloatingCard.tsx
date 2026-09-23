/**
 * FloatingCard
 * Elevated, rounded surface with an entrance animation and optional press feedback.
 */

import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from './PressableScale';

export interface FloatingCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Entrance animation delay in ms. */
  delay?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function FloatingCard({
  children,
  onPress,
  delay = 0,
  padding = 16,
  style,
}: FloatingCardProps) {
  const paddingStyle = { padding };
  const content = (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(16)}
      style={[styles.card, paddingStyle, style]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return <PressableScale onPress={onPress}>{content}</PressableScale>;
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
});

export default FloatingCard;
