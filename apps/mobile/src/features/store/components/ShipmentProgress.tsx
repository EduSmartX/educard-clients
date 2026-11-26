/**
 * A shipment's journey as numbered steps (Packed -> ... -> Delivered), or a cancelled
 * note. Shared by the tracking screen and the screen a scanned shipment QR opens.
 */

import {
  SHIPMENT_PROGRESS_STEPS,
  SHIPMENT_STATUS,
  SHIPMENT_STATUS_LABELS,
  type ShipmentStatus,
} from '@educard/shared';
import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface ShipmentProgressProps {
  status: ShipmentStatus;
  /** Colour of the steps already reached. */
  color?: string;
}

export function ShipmentProgress({
  status,
  color = '#7c3aed',
}: ShipmentProgressProps) {
  if (status === SHIPMENT_STATUS.CANCELLED) {
    return <Text style={styles.cancelled}>This shipment was cancelled</Text>;
  }
  const currentIndex = SHIPMENT_PROGRESS_STEPS.indexOf(
    status as (typeof SHIPMENT_PROGRESS_STEPS)[number],
  );

  return (
    <View style={styles.progress}>
      {SHIPMENT_PROGRESS_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <View key={step} style={styles.step}>
            <View
              style={[
                styles.stepDot,
                done && { backgroundColor: color, borderColor: color },
              ]}
            >
              {done ? (
                <Check size={12} color="#fff" />
              ) : (
                <Text style={styles.stepIndex}>{index + 1}</Text>
              )}
            </View>
            <Text
              style={[styles.stepLabel, done && styles.stepLabelDone]}
              numberOfLines={2}
            >
              {SHIPMENT_STATUS_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cancelled: { color: '#ef4444', fontWeight: '600' },
  progress: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndex: { fontSize: 11, color: '#6b7280' },
  stepLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center' },
  stepLabelDone: { color: '#111827', fontWeight: '600' },
});
