/**
 * ScreenHeader
 * Reusable gradient header for form & detail screens. Wraps the shared admin
 * header pattern (`headerStyles`): configurable gradient, decorative circles, a
 * back button (auto goBack) with title/subtitle and an optional right-side slot.
 */

import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { LinearGradient } from '@/lib/linear-gradient';
import { headerStyles } from '@/styles';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Gradient stops; defaults to the admin emerald gradient. */
  colors?: readonly [string, string, ...string[]];
  showBack?: boolean;
  /** Overrides the default `navigation.goBack()` behaviour. */
  onBack?: () => void;
  /** Right-side action slot; replaces the default spacer. */
  right?: React.ReactNode;
  decorative?: boolean;
}

const DEFAULT_GRADIENT = ['#059669', '#10b981'] as const;

export function ScreenHeader({
  title,
  subtitle,
  colors = DEFAULT_GRADIENT,
  showBack = true,
  onBack,
  right,
  decorative = true,
}: ScreenHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <LinearGradient colors={colors} style={headerStyles.header}>
      {decorative && (
        <>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={headerStyles.circle1}
            pointerEvents="none"
          />
          <Animated.View
            entering={FadeIn.delay(200)}
            style={headerStyles.circle2}
            pointerEvents="none"
          />
        </>
      )}
      <View style={headerStyles.content}>
        <View style={headerStyles.topRow}>
          {showBack && (
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={headerStyles.titleContainer}>
            <Text style={headerStyles.title} numberOfLines={1}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={headerStyles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          {right ?? (showBack ? <View style={styles.spacer} /> : null)}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  spacer: { width: 40 },
});

export default ScreenHeader;
