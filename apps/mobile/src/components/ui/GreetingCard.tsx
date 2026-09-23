/**
 * GreetingCard
 * Time-aware greeting banner shown under the dashboard hero, mirroring the web
 * dashboards (date line, "Good Morning, Name! ☀️", tagline and a highlight chip).
 */

import { Clock, Sparkles } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LinearGradient } from '@/lib/linear-gradient';

export function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
}

export interface GreetingCardProps {
  name: string;
  subtitle?: string;
  highlight?: string;
  colors?: readonly [string, string, ...string[]];
}

const DEFAULT_GRADIENT = ['#7c3aed', '#9333ea', '#c026d3'] as const;

export function GreetingCard({
  name,
  subtitle,
  highlight,
  colors = DEFAULT_GRADIENT,
}: GreetingCardProps) {
  const greeting = getGreeting();
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Animated.View entering={FadeInDown.delay(80).springify().damping(15)}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.blobTop} pointerEvents="none" />
        <View style={styles.blobBottom} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.textCol}>
            <View style={styles.dateRow}>
              <Clock size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>

            <Text style={styles.title}>
              {greeting.text}, {name}! {greeting.emoji}
            </Text>
          </View>
        </View>

        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {!!highlight && (
          <View style={styles.chip}>
            <Sparkles size={14} color="#fde047" />
            <Text style={styles.chipText}>{highlight}</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  blobTop: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -55,
    right: -40,
  },
  blobBottom: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: -45,
    left: -30,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  textCol: { flex: 1 },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  title: {
    marginTop: 10,
    fontSize: 21,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.8)',
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
