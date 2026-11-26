/**
 * The white back-arrow header every store screen uses (title, optional subtitle and a
 * right-side action).
 */
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StoreHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function StoreHeader({ title, subtitle, right }: StoreHeaderProps) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={12}
        onPress={() => navigation.canGoBack() && navigation.goBack()}
      >
        <ChevronLeft size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titles: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  right: { minWidth: 24, alignItems: 'flex-end' },
});
