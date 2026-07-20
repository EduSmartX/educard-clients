/**
 * GradientHeader
 * Reusable hero header: gradient background, decorative circles, greeting,
 * a notification bell with badge, an optional right slot, and an optional content slot.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Bell } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export interface GradientHeaderProps {
  title: string;
  greeting?: string;
  subtitle?: string;
  colors?: readonly [string, string, ...string[]];
  onNotificationPress?: () => void;
  notificationCount?: number;
  /** Custom right-side content (e.g. a profile avatar/button). */
  right?: React.ReactNode;
  /** Extra content rendered below the header row (e.g. a child selector). */
  children?: React.ReactNode;
  decorative?: boolean;
}

const DEFAULT_GRADIENT = ['#059669', '#10b981', '#14b8a6', '#06b6d4'] as const;

export function GradientHeader({
  title,
  greeting,
  subtitle,
  colors = DEFAULT_GRADIENT,
  onNotificationPress,
  notificationCount,
  right,
  children,
  decorative = true,
}: GradientHeaderProps) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {decorative && (
        <>
          <Animated.View entering={FadeIn.delay(100).duration(800)} style={styles.circle1} />
          <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.circle2} />
          <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.circle3} />
        </>
      )}

      <Animated.View entering={FadeInDown.delay(100).springify().damping(15)}>
        <View style={styles.row}>
          <View style={styles.textCol}>
            {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.right}>
            {onNotificationPress ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onNotificationPress}
                activeOpacity={0.7}
              >
                <Bell size={20} color="#fff" />
                {notificationCount ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ) : null}
            {right}
          </View>
        </View>
        {children}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 40,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    right: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textCol: { flex: 1, paddingRight: 12 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});

export default GradientHeader;
