/**
 * The details a student's ID card design prints that are still empty in their profile
 * (same as the web's "Missing on the ID card" card). Renders nothing when complete.
 */
import type { StudentCard } from '@educard/shared';
import { AlertTriangle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface MissingCardFieldsProps {
  card: StudentCard | undefined;
  /** What to do about it, e.g. "Tap Edit details to fill them in." */
  action?: string;
}

export function MissingCardFields({
  card,
  action = 'The card prints without these. Edit the student’s details to fill them in.',
}: MissingCardFieldsProps) {
  const missing = card?.available ? (card.missing_fields ?? []) : [];
  if (missing.length === 0) {
    return null;
  }
  return (
    <View style={styles.box} accessibilityRole="alert">
      <View style={styles.titleRow}>
        <AlertTriangle size={18} color="#b45309" />
        <Text style={styles.title}>
          Missing on the ID card ({missing.length} detail
          {missing.length === 1 ? '' : 's'})
        </Text>
      </View>
      <View style={styles.chips}>
        {missing.map(item => (
          <View key={item.field} style={styles.chip}>
            <Text style={styles.chipText}>{item.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.action}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#92400e', flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#fff',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#92400e' },
  action: { fontSize: 13, color: '#92400e', lineHeight: 19 },
});
