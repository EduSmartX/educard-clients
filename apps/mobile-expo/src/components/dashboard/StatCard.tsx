/**
 * StatCard Component
 * Reusable stat card for dashboards with gradient background
 */

import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

export interface StatCardProps {
  /** Display title */
  title: string;
  /** Value to display (string for flexibility - can be number, percentage, text) */
  value: string;
  /** Icon component from lucide-react-native */
  icon: LucideIcon;
  /** Gradient colors [start, middle, end] */
  gradient: readonly [string, string, string];
  /** Shadow color for the card */
  shadowColor: string;
  /** Animation delay index (for staggered animations) */
  animationIndex?: number;
  /** Optional trend indicator: 'up', 'down', or undefined for no trend */
  trend?: 'up' | 'down';
  /** Optional trend value (e.g., "+5%") */
  trendValue?: string;
}

/** StatCardProps with an id field for use in lists/grids */
export interface StatCardData extends StatCardProps {
  id?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  shadowColor,
  animationIndex = 0,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <Animated.View
      entering={ZoomIn.delay(150 + animationIndex * 80)
        .springify()
        .damping(12)
        .stiffness(100)}
      style={[styles.card, { shadowColor }]}
    >
      <LinearGradient
        colors={gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon size={16} color="#fff" strokeWidth={2.5} />
          </View>
          {trend && (
            <View style={[styles.trendBadge, trend === 'up' ? styles.trendUp : styles.trendDown]}>
              {trend === 'up' ? (
                <TrendingUp size={10} color="#fff" strokeWidth={2.5} />
              ) : (
                <TrendingDown size={10} color="#fff" strokeWidth={2.5} />
              )}
              {trendValue && <Text style={styles.trendText}>{trendValue}</Text>}
            </View>
          )}
        </View>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  gradient: {
    padding: 14,
    height: 120,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  trendText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
