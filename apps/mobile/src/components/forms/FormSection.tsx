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
  section: { marginBottom: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  icon: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '600', color: '#334155' },
  body: {},
});
