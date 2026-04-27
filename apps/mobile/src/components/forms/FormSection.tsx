/**
 * FormSection - Groups form fields with a title and optional icon
 */

import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormSectionProps {
  title: string;
  icon?: string; // emoji
  children: ReactNode;
}

export function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  icon: { fontSize: 18 },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  body: {},
});
