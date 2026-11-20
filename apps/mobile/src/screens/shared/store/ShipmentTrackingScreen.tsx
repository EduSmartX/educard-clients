/**
 * Shipment Tracking Screen - what a shipment QR shows: school, contents, status and
 * journey. EduCard shipment staff can also record the next checkpoint here.
 */

import {
  SHIPMENT_LOCATION_REQUIRED_STATUSES,
  SHIPMENT_PROGRESS_STEPS,
  SHIPMENT_STATUS,
  SHIPMENT_STATUS_LABELS,
  getErrorMessage,
  type ShipmentStatus,
  type ShipmentTracking,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Check, ChevronLeft, PackageSearch } from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/common';
import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { useRecordShipmentEvent, useShipmentTracking } from '@/features/store';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

const PRIMARY = '#2563eb';

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : '';
}

function ProgressTracker({ status }: { status: ShipmentStatus }) {
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
            <View style={[styles.stepDot, done && styles.stepDotDone]}>
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

function RecordUpdate({
  token,
  shipment,
}: {
  token: string;
  shipment: ShipmentTracking;
}) {
  const [status, setStatus] = useState<ShipmentStatus | null>(null);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const recordEvent = useRecordShipmentEvent(token);

  if (shipment.next_statuses.length === 0) {
    return null;
  }

  const needsLocation =
    status !== null && SHIPMENT_LOCATION_REQUIRED_STATUSES.includes(status);
  const canSubmit =
    status !== null && (!needsLocation || location.trim().length > 0);

  const handleSubmit = () => {
    if (!status) {
      return;
    }
    recordEvent.mutate(
      { status, location: location.trim(), note: note.trim() },
      {
        onSuccess: () => {
          showToast('success', 'Shipment updated');
          setStatus(null);
          setLocation('');
          setNote('');
        },
        onError: error =>
          showToast(
            'error',
            getErrorMessage(error, 'Could not update this shipment'),
          ),
      },
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Record an update</Text>
      <View style={styles.optionRow}>
        {shipment.next_statuses.map(option => {
          const active = status === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setStatus(option.value)}
            >
              <Text
                style={[styles.optionText, active && styles.optionTextActive]}
              >
                {option.value === shipment.status
                  ? `${option.label} (checkpoint)`
                  : option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        style={styles.input}
        placeholder={
          needsLocation ? 'Current location (required)' : 'Current location'
        }
        maxLength={200}
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Note (optional)"
        maxLength={500}
        multiline
        value={note}
        onChangeText={setNote}
      />
      <SubmitButton
        label="Save update"
        onPress={handleSubmit}
        isLoading={recordEvent.isPending}
        disabled={!canSubmit}
      />
    </View>
  );
}

export default function ShipmentTrackingScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'ShipmentTracking'>>();
  const insets = useSafeAreaInsets();
  const { token } = route.params;

  const { data, isLoading, isError } = useShipmentTracking(token);
  const shipment = data?.data;

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {shipment?.shipment_number ?? 'Shipment'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <LoadingState color={PRIMARY} />
      ) : isError || !shipment ? (
        <EmptyState
          icon={<PackageSearch size={40} color="#9ca3af" />}
          message="Shipment not found"
          subMessage="The code may be wrong, or it belongs to another school."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.summary}>
              <View style={styles.summaryText}>
                <Text style={styles.label}>School</Text>
                <Text style={styles.value}>{shipment.organization_name}</Text>
                <Text style={styles.label}>Order</Text>
                <Text style={styles.value}>{shipment.order_number}</Text>
                <Text style={styles.label}>Current location</Text>
                <Text style={styles.value}>
                  {shipment.current_location || 'Not yet reported'}
                </Text>
                <Text style={styles.label}>
                  {shipment.delivered_at ? 'Delivered' : 'Expected delivery'}
                </Text>
                <Text style={styles.value}>
                  {formatDate(
                    shipment.delivered_at ?? shipment.expected_delivery_date,
                  ) || 'To be confirmed'}
                </Text>
              </View>
              <View style={styles.qr}>
                <SvgXml xml={shipment.qr_svg} width={96} height={96} />
              </View>
            </View>
            <ProgressTracker status={shipment.status} />
          </View>

          {shipment.can_update && (
            <RecordUpdate token={token} shipment={shipment} />
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>In this package</Text>
            {shipment.items.map((item, index) => (
              <View key={`${item.product_name}-${index}`} style={styles.line}>
                <View style={styles.lineTop}>
                  <Text style={styles.value}>{item.product_name}</Text>
                  <Text style={styles.value}>× {item.quantity}</Text>
                </View>
                {item.details.length > 0 && (
                  <Text style={styles.label}>
                    {item.details
                      .map(detail => `${detail.label}: ${detail.value}`)
                      .join(' · ')}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Journey</Text>
            {shipment.events.map((event, index) => (
              <View
                key={`${event.occurred_at}-${index}`}
                style={styles.eventRow}
              >
                <View
                  style={[
                    styles.eventDot,
                    index === 0 && styles.eventDotLatest,
                  ]}
                />
                <View style={styles.eventBody}>
                  <Text style={styles.value}>
                    {event.status_label}
                    {event.location ? ` · ${event.location}` : ''}
                  </Text>
                  <Text style={styles.label}>
                    {new Date(event.occurred_at).toLocaleString()}
                    {event.recorded_by_name
                      ? ` · ${event.recorded_by_name}`
                      : ''}
                  </Text>
                  {event.note ? (
                    <Text style={styles.note}>{event.note}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSpacer: { width: 24 },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  summary: { flexDirection: 'row', gap: 12 },
  summaryText: { flex: 1 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  note: { fontSize: 13, color: '#374151', marginTop: 2 },
  qr: { backgroundColor: '#fff', padding: 2, borderRadius: 8 },
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
  stepDotDone: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepIndex: { fontSize: 11, color: '#6b7280' },
  stepLabel: { fontSize: 10, color: '#6b7280', textAlign: 'center' },
  stepLabelDone: { color: '#111827', fontWeight: '600' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  optionActive: { borderColor: PRIMARY, backgroundColor: '#eff6ff' },
  optionText: { fontSize: 13, color: '#374151' },
  optionTextActive: { color: PRIMARY, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  line: { gap: 2 },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between' },
  eventRow: { flexDirection: 'row', gap: 10 },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d1d5db',
    marginTop: 4,
  },
  eventDotLatest: { backgroundColor: PRIMARY },
  eventBody: { flex: 1 },
});
