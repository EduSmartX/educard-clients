/**
 * Shared Detail View Components
 * Reusable Row, Section, Chip, and ScreenShell for all view/detail screens
 */

import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

// ─── Row ──────────────────────────────────────────
export function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
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
export function ChipRow({
  items,
}: {
  items: { key: string; label: string }[];
}) {
  return (
    <View style={styles.chipRow}>
      {items.map(item => (
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
  /** Explicit back navigation. Falls back to navigation.goBack(). */
  onBack?: () => void;
  /** Name for profile avatar initials */
  avatarName?: string;
  /** Image URI for profile avatar */
  avatarImageUri?: string | null;
}

export function DetailScreenShell({
  title,
  subtitle,
  isLoading,
  isError,
  errorMessage,
  children,
  onBack,
  avatarName,
  avatarImageUri,
}: DetailScreenShellProps) {
  const navigation = useNavigation<SharedStackNavigation>();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
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
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <Pressable
              style={headerStyles.backBtn}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{title}</Text>
              {subtitle ? (
                <Text style={headerStyles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>
            <View style={styles.spacer} />
          </View>
        </View>
      </LinearGradient>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      )}
      {!isLoading && isError && (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {errorMessage ?? 'Failed to load details.'}
          </Text>
        </View>
      )}
      {!isLoading && !isError && (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {avatarName ? (
            <Animated.View
              entering={FadeIn.delay(150)}
              style={styles.avatarWrapper}
            >
              <ProfileAvatar
                name={avatarName}
                imageUri={avatarImageUri}
                size={80}
              />
              <Text style={styles.avatarName}>{avatarName}</Text>
            </Animated.View>
          ) : null}
          {children}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  spacer: { width: 40 },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 10,
  },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: { fontSize: 14, color: '#64748b', flex: 1 },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1.5,
    textAlign: 'right',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
});
