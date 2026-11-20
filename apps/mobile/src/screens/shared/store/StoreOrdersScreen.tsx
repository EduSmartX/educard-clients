/**
 * Store Orders Screen - follow placed orders and their shipments to delivery.
 * EduCard confirms and ships orders; the school can cancel until packing starts.
 */

import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORGANIZATION_CANCELLABLE_ORDER_STATUSES,
  getErrorMessage,
  type Order,
  type ShipmentSummary,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin, Package } from 'lucide-react-native';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { useOrders, useUpdateOrderStatus } from '@/features/store';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#2563eb',
  processing: '#7c3aed',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : '';
}

function ShipmentRow({
  shipment,
  onTrack,
}: {
  shipment: ShipmentSummary;
  onTrack: () => void;
}) {
  return (
    <TouchableOpacity style={styles.shipment} onPress={onTrack}>
      <View style={styles.qr}>
        <SvgXml xml={shipment.qr_svg} width={64} height={64} />
      </View>
      <View style={styles.shipmentBody}>
        <Text style={styles.shipmentNumber}>{shipment.shipment_number}</Text>
        <Text style={styles.shipmentStatus}>{shipment.status_label}</Text>
        {shipment.current_location ? (
          <View style={styles.locationRow}>
            <MapPin size={12} color="#6b7280" />
            <Text style={styles.meta}>{shipment.current_location}</Text>
          </View>
        ) : null}
        <Text style={styles.meta}>
          {shipment.delivered_at
            ? `Delivered ${formatDate(shipment.delivered_at)}`
            : shipment.expected_delivery_date
              ? `Expected by ${formatDate(shipment.expected_delivery_date)}`
              : 'Delivery date to be confirmed'}
        </Text>
      </View>
      <Text style={styles.trackLink}>Track</Text>
    </TouchableOpacity>
  );
}

export default function StoreOrdersScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const orders = data?.data ?? [];

  const handleCancel = (order: Order) => {
    updateStatus.mutate(
      { publicId: order.public_id, status: ORDER_STATUS.CANCELLED },
      {
        onSuccess: () =>
          showToast('success', `Order ${order.order_number} cancelled`),
        onError: error =>
          showToast(
            'error',
            getErrorMessage(error, 'Could not cancel this order'),
          ),
      },
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const cancellable = ORGANIZATION_CANCELLABLE_ORDER_STATUSES.includes(
      item.status,
    );
    const shipments = item.shipments ?? [];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.meta}>
              {new Date(item.placed_at).toLocaleDateString()}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${STATUS_COLOR[item.status] ?? '#6b7280'}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: STATUS_COLOR[item.status] ?? '#6b7280' },
              ]}
            >
              {ORDER_STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
        </View>

        {item.items.map((line, index) => (
          <View key={`${line.product_code}-${index}`} style={styles.lineRow}>
            <Text style={styles.lineText}>
              {line.product_name} × {line.quantity}
            </Text>
            <Text style={styles.lineText}>
              {formatCurrency(line.line_total)}
            </Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(item.total_amount)}
          </Text>
        </View>

        {shipments.length > 0 && (
          <View style={styles.shipments}>
            <Text style={styles.sectionTitle}>Shipments</Text>
            {shipments.map(shipment => (
              <ShipmentRow
                key={shipment.tracking_token}
                shipment={shipment}
                onTrack={() =>
                  navigation.navigate('ShipmentTracking', {
                    token: shipment.tracking_token,
                  })
                }
              />
            ))}
          </View>
        )}

        {cancellable && (
          <View style={styles.actions}>
            <Text style={[styles.meta, styles.actionsHint]}>
              You can cancel until EduCard starts packing.
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              disabled={updateStatus.isPending}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.actionText}>Cancel order</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <LoadingState color="#2563eb" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package size={40} color="#9ca3af" />}
          message="No orders yet"
          subMessage="Orders you place from the store will appear here."
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.public_id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
        />
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
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  lineText: { fontSize: 13, color: '#4b5563' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  shipments: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
    paddingTop: 10,
    gap: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  shipment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 8,
  },
  qr: { backgroundColor: '#fff', padding: 2, borderRadius: 6 },
  shipmentBody: { flex: 1 },
  shipmentNumber: { fontSize: 13, fontWeight: '700', color: '#111827' },
  shipmentStatus: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackLink: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  actionsHint: { flex: 1 },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
});
