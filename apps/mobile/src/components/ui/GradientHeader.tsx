/**
 * GradientHeader — Shadow & Fabric Insulated Version
 */

import { Bell } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import { LinearGradient } from '@/lib/linear-gradient';

export interface GradientHeaderProps {
  title: string;
  greeting?: string;
  subtitle?: string;
  colors?: readonly [string, string, ...string[]];
  onNotificationPress?: () => void;
  notificationCount?: number;
  right?: React.ReactNode;
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
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </>
      )}

      {/* 
        INSULATION LAYER: 
        Wrapping the inner components in a standard, clean layout View container 
        strips the shadow calculation conflict away from the text components under Fabric.
      */}
      <View style={styles.innerWrapper}>
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    // Removed any trace of shadow parameters from the gradient wrapper itself
  },
  innerWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 10,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
