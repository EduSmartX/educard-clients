/**
 * ListHeader Component
 * Reusable header for list screens with back button and actions
 */

import { getRoleGradient, getRoleThemeColors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface HeaderAction {
  icon: LucideIcon;
  onPress: () => void;
  variant?: 'default' | 'primary';
}

interface ListHeaderProps {
  title: string;
  subtitle?: string;
  role?: 'admin' | 'teacher' | 'parent' | 'student';
  showBack?: boolean;
  actions?: HeaderAction[];
  /** Explicit back navigation. Falls back to router.back() then management tab. */
  onBack?: () => void;
}

export function ListHeader({
  title,
  subtitle,
  role = 'admin',
  showBack = true,
  actions = [],
  onBack,
}: ListHeaderProps) {
  const router = useRouter();
  const gradient = getRoleGradient(role);
  const theme = getRoleThemeColors(role);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Use navigate to properly switch tabs within the Tabs navigator
      router.navigate('/(tabs)/(admin)/management');
    }
  };

  return (
    <LinearGradient colors={gradient} style={styles.header}>
      <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
      <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />

      <View style={styles.content}>
        <View style={styles.row}>
          {showBack && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionBtn, action.variant === 'primary' && styles.primaryBtn]}
                onPress={action.onPress}
              >
                <action.icon
                  size={20}
                  color={action.variant === 'primary' ? theme.accent : '#fff'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: { zIndex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: { backgroundColor: '#fff' },
});
