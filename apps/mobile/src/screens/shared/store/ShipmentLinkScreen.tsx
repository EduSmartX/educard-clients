/**
 * Shipment (from a scanned QR) - what the parcel's QR link shows, opened in the app
 * instead of the browser: where it goes (call the school, open in Maps), what is in it,
 * and how far it has got. Works signed in or not. Signed-in staff can open the full
 * tracking screen to record updates.
 */

import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isAxiosError } from 'axios';
import {
  ChevronLeft,
  MapPin,
  PackageSearch,
  Phone,
  Route,
} from 'lucide-react-native';
import { useEffect } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { formatDate, usePublicShipment } from '@/features/store';
import { ShipmentProgress } from '@/features/store/components/ShipmentProgress';
import { useAuthStore } from '@/lib/auth-store';
import type { RootStackParamList } from '@/navigation/types';
import { layoutStyles } from '@/styles';

const BRAND = '#7c3aed';

type LinkRoute = RouteProp<RootStackParamList, 'ShipmentLink'>;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

function httpStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export default function ShipmentLinkScreen() {
  const navigation = useNavigation<RootNavigation>();
  const { params } = useRoute<LinkRoute>();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { data, isLoading, error } = usePublicShipment(params.token);
  const shipment = data?.data;
  // 403: public QR pages are switched off, so only signed-in staff can see shipments.
  const loginRequired = httpStatus(error) === 403;

  const close = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: isAuthenticated ? 'Main' : 'Auth' }],
      });
    }
  };
  const openTracking = () =>
    navigation.navigate('Main', {
      screen: 'ShipmentTracking',
      params: { token: params.token },
    });

  // Signed in and public pages are off: go straight to the staff tracking screen.
  useEffect(() => {
    if (loginRequired && isAuthenticated) {
      navigation.replace('Main', {
        screen: 'ShipmentTracking',
        params: { token: params.token },
      });
    }
  }, [loginRequired, isAuthenticated, navigation, params.token]);

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={close}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.flex}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {shipment?.shipment_number ?? 'Shipment'}
          </Text>
          <Text style={styles.headerSub}>
            Scanned from the parcel’s QR code
          </Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingState color={BRAND} message="Loading the shipment…" />
      ) : loginRequired ? (
        <EmptyState
          icon={<PackageSearch size={40} color="#9ca3af" />}
          message="Sign in to see this shipment"
          subMessage="Only the school admin and EduCard staff can open it."
        />
      ) : error || !shipment ? (
        <EmptyState
          icon={<PackageSearch size={40} color="#9ca3af" />}
          message="Shipment not found"
          subMessage="The QR code may be damaged, or this shipment was removed."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.pill,
                  shipment.status === 'delivered' && styles.pillOk,
                  shipment.status === 'cancelled' && styles.pillBad,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    shipment.status === 'delivered' && styles.pillTextOk,
                    shipment.status === 'cancelled' && styles.pillTextBad,
                  ]}
                >
                  {shipment.status_label}
                </Text>
              </View>
              <Text style={styles.muted}>Order {shipment.order_number}</Text>
            </View>
            {shipment.status === 'cancelled' ? (
              <Text style={styles.cancelled}>
                This shipment was cancelled. Do not deliver it; return it to
                EduCard.
              </Text>
            ) : (
              <ShipmentProgress status={shipment.status} />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>DELIVER TO</Text>
            <Text style={styles.school}>{shipment.school.name}</Text>
            <Text style={styles.address}>
              {shipment.school.address ||
                'No address on file. Call the school before delivering.'}
            </Text>
            <View style={styles.actions}>
              {shipment.school.phone ? (
                <TouchableOpacity
                  style={[styles.action, styles.actionPrimary]}
                  onPress={() =>
                    void Linking.openURL(`tel:${shipment.school.phone}`)
                  }
                  accessibilityRole="button"
                >
                  <Phone size={18} color="#fff" />
                  <Text style={styles.actionPrimaryText}>
                    Call {shipment.school.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {shipment.maps_url ? (
                <TouchableOpacity
                  style={styles.action}
                  onPress={() => void Linking.openURL(shipment.maps_url)}
                  accessibilityRole="button"
                >
                  <MapPin size={18} color="#111827" />
                  <Text style={styles.actionText}>Open in Maps</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              IN THIS PARCEL · {shipment.units} ITEM
              {shipment.units === 1 ? '' : 'S'}
            </Text>
            {shipment.lines.map((line, index) => (
              <View
                key={`${line.product_name}-${index}`}
                style={[styles.line, index > 0 && styles.lineBorder]}
              >
                <View style={styles.flex}>
                  <Text style={styles.lineName}>{line.product_name}</Text>
                  {line.details.map(detail => (
                    <Text key={detail.label} style={styles.muted}>
                      {detail.label}: {detail.value}
                    </Text>
                  ))}
                </View>
                <Text style={styles.qty}>× {line.quantity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>SHIPMENT DETAILS</Text>
            <Fact label="Packed on" value={formatDate(shipment.packed_at)} />
            {shipment.expected_delivery_date ? (
              <Fact
                label="Expected by"
                value={formatDate(shipment.expected_delivery_date)}
              />
            ) : null}
            {shipment.current_location ? (
              <Fact label="Now at" value={shipment.current_location} />
            ) : null}
            {shipment.carrier_name ? (
              <Fact
                label="Carrier"
                value={[shipment.carrier_name, shipment.carrier_reference]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ) : null}
            {shipment.delivered_at ? (
              <Fact
                label="Delivered"
                value={formatDate(shipment.delivered_at)}
              />
            ) : null}
          </View>

          {shipment.events.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>UPDATES</Text>
              {shipment.events.map((event, index) => (
                <View
                  key={`${event.occurred_at}-${index}`}
                  style={[styles.event, index > 0 && styles.lineBorder]}
                >
                  <Text style={styles.lineName}>
                    {event.status_label}
                    {event.location ? ` · ${event.location}` : ''}
                  </Text>
                  {event.note ? (
                    <Text style={styles.muted}>{event.note}</Text>
                  ) : null}
                  <Text style={styles.when}>
                    {new Date(event.occurred_at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {isAuthenticated ? (
            <TouchableOpacity
              style={[styles.action, styles.trackButton]}
              onPress={openTracking}
              accessibilityRole="button"
            >
              <Route size={18} color={BRAND} />
              <Text style={[styles.actionText, styles.trackText]}>
                Open full tracking (record updates)
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#6b7280',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: {
    backgroundColor: '#f3e8ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillOk: { backgroundColor: '#dcfce7' },
  pillBad: { backgroundColor: '#fee2e2' },
  pillText: { fontSize: 14, fontWeight: '700', color: BRAND },
  pillTextOk: { color: '#15803d' },
  pillTextBad: { color: '#b91c1c' },
  cancelled: { fontSize: 15, fontWeight: '600', color: '#b91c1c' },
  school: { fontSize: 20, fontWeight: '800', color: '#111827' },
  address: { fontSize: 16, color: '#111827', lineHeight: 23 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  actionPrimary: { backgroundColor: BRAND, borderColor: BRAND },
  actionPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  actionText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  line: { flexDirection: 'row', gap: 12, paddingTop: 2 },
  lineBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  lineName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  qty: { fontSize: 18, fontWeight: '800', color: '#111827' },
  muted: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { fontSize: 14, color: '#6b7280' },
  factValue: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  event: { gap: 2 },
  when: { fontSize: 12, color: '#6b7280' },
  trackButton: { borderColor: BRAND, backgroundColor: '#faf5ff' },
  trackText: { color: BRAND },
});
