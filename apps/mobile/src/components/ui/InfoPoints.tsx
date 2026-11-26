/**
 * Short guidance as easy-to-scan points instead of a paragraph (same as the web app).
 * Empty items (null / false / '') are skipped, so points can be conditional.
 */
import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Theme } from '@/constants/theme';

interface InfoPointsProps {
  items: (ReactNode | null | false | undefined)[];
  tone?: 'default' | 'muted';
  style?: StyleProp<ViewStyle>;
}

export function InfoPoints({
  items,
  tone = 'default',
  style,
}: InfoPointsProps) {
  const shown = items.filter(
    item =>
      item !== null && item !== false && item !== undefined && item !== '',
  );
  if (shown.length === 0) {
    return null;
  }
  return (
    <View style={[styles.list, style]}>
      {shown.map((item, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.dot} />
          {typeof item === 'string' ? (
            <Text style={[styles.text, tone === 'muted' && styles.muted]}>
              {item}
            </Text>
          ) : (
            <View style={styles.flex}>{item}</View>
          )}
        </View>
      ))}
    </View>
  );
}

/** Text that matches an InfoPoints line, for points with bold parts. */
export function InfoPointText({ children }: { children: ReactNode }) {
  return <Text style={styles.text}>{children}</Text>;
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: '#8b5cf6',
  },
  flex: { flex: 1 },
  text: {
    flex: 1,
    fontSize: Theme.typography.size.md,
    lineHeight: 21,
    color: '#111827',
  },
  muted: { color: '#6b7280' },
});
