/**
 * EmptyState Component
 * Reusable empty state display
 */

import { Colors } from '@educard/shared';
import { LucideIcon } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  iconSize?: number;
}

export function EmptyState({ icon: Icon, title, subtitle, iconSize = 48 }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={iconSize} color={Colors.gray[300]} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[500],
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: { fontSize: 13, color: Colors.gray[400], marginTop: 4, textAlign: 'center' },
});
