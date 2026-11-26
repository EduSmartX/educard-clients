/**
 * An ID card with a Front / Back switch, rendered by the server exactly as it will print.
 * Fits the available width (pass the container width), portrait or landscape.
 */
import type { CardOrientation } from '@educard/shared';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CardPreviewImage } from './CardPreviewImage';

interface CardSidesProps {
  frontPath: string | undefined;
  backPath?: string | null;
  orientation?: CardOrientation;
  /** Width the card may use; portrait cards are scaled to fit the same box. */
  width: number;
  student?: string;
}

export function CardSides({
  frontPath,
  backPath,
  orientation = 'landscape',
  width,
  student,
}: CardSidesProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const path = side === 'back' && backPath ? backPath : frontPath;
  const portrait = orientation === 'portrait';
  // A portrait card is as tall as a landscape one is wide; keep it a comfortable size.
  const cardWidth = portrait ? Math.min(width, 300) : width;

  return (
    <View style={styles.wrap}>
      <CardPreviewImage
        path={path}
        student={student}
        orientation={orientation}
        width={cardWidth}
      />
      {backPath ? (
        <View style={styles.switch} accessibilityRole="tablist">
          {(['front', 'back'] as const).map(value => {
            const active = side === value;
            return (
              <TouchableOpacity
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setSide(value)}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text
                  style={[styles.optionText, active && styles.optionTextActive]}
                >
                  {value === 'front' ? 'Front' : 'Back'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  switch: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    padding: 3,
  },
  option: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 999 },
  optionActive: {
    backgroundColor: '#fff',
    elevation: 1,
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  optionText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  optionTextActive: { color: '#111827' },
});
