/**
 * QuickActionsGrid
 * Responsive grid of gradient action tiles with icon + label and press feedback.
 */

import { type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LinearGradient } from '@/lib/linear-gradient';

import { PressableScale } from './PressableScale';

export interface QuickAction {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
}

export interface QuickActionsGridProps {
  actions: QuickAction[];
  /** Tiles per row (default 4). */
  columns?: number;
}

export function QuickActionsGrid({
  actions,
  columns = 4,
}: QuickActionsGridProps) {
  const cellWidthStyle = { width: `${100 / columns}%` as DimensionValue };

  return (
    <View style={styles.grid}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Animated.View
            key={action.id}
            entering={FadeInDown.delay(index * 60)
              .springify()
              .damping(15)}
            style={[styles.cell, cellWidthStyle]}
          >
            <PressableScale onPress={action.onPress} style={styles.pressable}>
              <View style={styles.tile}>
                <LinearGradient
                  colors={action.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrap}
                >
                  <Icon size={24} color="#fff" strokeWidth={2} />
                </LinearGradient>
                <Text style={styles.title} numberOfLines={2}>
                  {action.title}
                </Text>
              </View>
            </PressableScale>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  pressable: {
    alignItems: 'center',
  },
  tile: {
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});

export default QuickActionsGrid;
