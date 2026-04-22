/**
 * Shared Detail View Components
 * Reusable Row, Section, Chip, and ScreenShell for all view/detail screens
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { getRoleGradient } from '@educard/shared';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

// ─── Row ──────────────────────────────────────────
export function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

// ─── Section ──────────────────────────────────────
export function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

// ─── Chip row ─────────────────────────────────────
export function ChipRow({ items }: { items: { key: string; label: string }[] }) {
  return (
    <View style={styles.chipRow}>
      {items.map((item) => (
        <View key={item.key} style={styles.chip}>
          <Text style={styles.chipText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Screen Shell (header + loading/error/content) ─
interface DetailScreenShellProps {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  /** Explicit back navigation. Falls back to router.back(). */
  onBack?: () => void;
}

export function DetailScreenShell({
  title,
  subtitle,
  isLoading,
  isError,
  errorMessage,
  children,
  onBack,
}: DetailScreenShellProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.navigate('/(tabs)/(admin)/management' as any);
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{title}</Text>
              {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage || 'Failed to load details.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: { fontSize: 14, color: '#64748b', flex: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1.5, textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
});
