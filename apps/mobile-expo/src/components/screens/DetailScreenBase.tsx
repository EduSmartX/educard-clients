/**
 * DetailScreenBase - Shared layout for detail/view screens
 * Provides header, loading state, error state, and content area.
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

/** Shared Row component for label-value pairs */
export function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.rowLabel}>{label}</Text>
      <Text style={detailStyles.rowValue}>{String(value)}</Text>
    </View>
  );
}

/** Shared Section component with icon + title */
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
    <View style={detailStyles.section}>
      <Text style={detailStyles.sectionTitle}>
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

export interface DetailScreenBaseProps {
  title: string;
  subtitle: string;
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  errorMessage?: string;
  children: React.ReactNode;
}

export function DetailScreenBase({
  title,
  subtitle,
  isLoading,
  isError,
  hasData,
  errorMessage = 'Failed to load details.',
  children,
}: DetailScreenBaseProps) {
  const router = useRouter();

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={[...adminGradient]} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{title}</Text>
              <Text style={headerStyles.subtitle}>{subtitle}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading && (
        <View style={detailStyles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      )}
      {!isLoading && (isError || !hasData) && (
        <View style={detailStyles.center}>
          <Text style={detailStyles.errorText}>{errorMessage}</Text>
        </View>
      )}
      {!isLoading && !isError && hasData && (
        <ScrollView
          contentContainerStyle={detailStyles.container}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}

export const detailStyles = StyleSheet.create({
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
});
