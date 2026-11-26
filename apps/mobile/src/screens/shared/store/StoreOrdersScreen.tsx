/**
 * Store Orders Screen - follow placed orders and their shipments to delivery.
 *
 * ordered -> in review -> waiting for approval -> approved -> processing -> shipped ->
 * delivered (orders without ID cards skip the approval steps). The school can cancel by
 * itself until it approves; after that it calls EduCard.
 */

import {
  ORDER_STATUS,
  ORDER_STATUS_HINTS,
  ORDER_STATUS_LABELS,
  getErrorMessage,
  orderSteps,
  useDebounce,
  type Order,
  type ShipmentSummary,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MapPin, Package, Phone } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchBar } from '@/components/common';
import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import {
  ActiveFilters,
  FilterModal,
  buildOrderFilterFields,
  getOrderFilterLabels,
  orderFilterParams,
  type OrderFiltersState,
} from '@/components/filters';
import {
  useOrderFilterOptions,
  useOrderPages,
  useUpdateOrderStatus,
} from '@/features/store';
import { useAppInfo } from '@/hooks/use-app-info';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

const STATUS_COLOR: Record<string, string> = {
  ordered: '#f59e0b',
  in_review: '#2563eb',
  awaiting_approval: '#d97706',
  approved: '#16a34a',
  processing: '#7c3aed',
  shipped: '#0891b2',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

/** After approval the school calls EduCard to cancel (EduCard can until it ships). */
const CALL_TO_CANCEL: readonly string[] = [
  ORDER_STATUS.APPROVED,
  ORDER_STATUS.PROCESSING,
];

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

  // Filters (same as the web page): order number search, status, product, dates.
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState<OrderFiltersState>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data: filterOptions } = useOrderFilterOptions();
  const params = useMemo(
    () => orderFilterParams(filters, debouncedSearch),
    [filters, debouncedSearch],
  );
  const filtering = Object.keys(params).length > 0;
  const activeLabels = getOrderFilterLabels(filters, filterOptions);

  const {
    data,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrderPages(params);
  const updateStatus = useUpdateOrderStatus();
  const { data: appInfo } = useAppInfo();
  const supportPhone = appInfo?.support_phone;

  const orders = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const clearAll = () => {
    setFilters({});
    setSearch('');
  };
  const removeFilter = (key: string) =>
    setFilters(current => {
      const next = { ...current };
      delete next[key as keyof OrderFiltersState];
      return next;
    });
  // The order being cancelled (the dialog asks for an optional reason).
  const [cancelling, setCancelling] = useState<Order | null>(null);

  const confirmCancel = (order: Order) => setCancelling(order);

  const handleCancel = (order: Order, reason: string) => {
    updateStatus.mutate(
      { publicId: order.public_id, status: ORDER_STATUS.CANCELLED, reason },
      {
        onSuccess: () => {
          setCancelling(null);
          showToast('success', `Order ${order.order_number} cancelled`);
        },
        onError: error =>
          showToast(
            'error',
            getErrorMessage(error, 'Could not cancel this order'),
          ),
      },
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const shipments = item.shipments ?? [];
    const steps = orderSteps(item.needs_approval);
    const stepIndex = steps.indexOf(item.status);
    const callToCancel = CALL_TO_CANCEL.includes(item.status);

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
              {item.status_label ||
                ORDER_STATUS_LABELS[item.status] ||
                item.status}
            </Text>
          </View>
        </View>

        {stepIndex >= 0 && (
          <Text style={styles.stepText}>
            Step {stepIndex + 1} of {steps.length}
            {stepIndex < steps.length - 1
              ? ` · next: ${ORDER_STATUS_LABELS[steps[stepIndex + 1]]}`
              : ''}
          </Text>
        )}
        {item.cancellation ? (
          <View style={styles.cancelledBox}>
            <Text style={styles.cancelledTitle}>This order was cancelled</Text>
            {item.cancellation.by || item.cancellation.at ? (
              <Text style={styles.cancelledMeta}>
                {item.cancellation.by ? `by ${item.cancellation.by}` : ''}
                {item.cancellation.at
                  ? ` on ${formatDate(item.cancellation.at)}`
                  : ''}
              </Text>
            ) : null}
            {item.cancellation.reason ? (
              <Text style={styles.cancelledReason}>
                “{item.cancellation.reason}”
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.hint}>{ORDER_STATUS_HINTS[item.status]}</Text>
        )}

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

        {item.can_cancel && (
          <View style={styles.actions}>
            <Text style={[styles.meta, styles.actionsHint]}>
              You can cancel until you approve the order.
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              disabled={updateStatus.isPending}
              onPress={() => confirmCancel(item)}
            >
              <Text style={styles.actionText}>Cancel order</Text>
            </TouchableOpacity>
          </View>
        )}

        {callToCancel && (
          <TouchableOpacity
            style={styles.callRow}
            disabled={!supportPhone}
            onPress={() =>
              supportPhone && Linking.openURL(`tel:${supportPhone}`)
            }
          >
            <Phone size={14} color="#6b7280" />
            <Text style={[styles.meta, styles.actionsHint]}>
              Approved orders can't be cancelled here. To cancel, call EduCard
              {supportPhone ? ` on ${supportPhone}` : ''}.
            </Text>
          </TouchableOpacity>
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

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Order number, e.g. 000010"
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={activeLabels.length}
      />
      <ActiveFilters
        filters={activeLabels}
        onRemove={removeFilter}
        onClearAll={clearAll}
      />

      {isLoading ? (
        <LoadingState color="#2563eb" />
      ) : orders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<Package size={40} color="#9ca3af" />}
            message={
              filtering ? 'No orders match these filters' : 'No orders yet'
            }
            subMessage={
              filtering
                ? 'Try another status, product or date range.'
                : 'Orders you place from the store will appear here.'
            }
          />
          {filtering ? (
            <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
              <Text style={styles.clearButtonText}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.public_id}
          renderItem={renderOrder}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          style={isFetching && !isFetchingNextPage ? styles.dimmed : null}
          ListHeaderComponent={
            <Text style={styles.count}>
              {total} order{total === 1 ? '' : 's'}
              {filtering
                ? ` ${total === 1 ? 'matches' : 'match'} your filters`
                : ''}
            </Text>
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color="#2563eb" />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
            />
          }
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={applied => {
          setFilters(applied as OrderFiltersState);
          setShowFilters(false);
        }}
        fields={buildOrderFilterFields(filterOptions)}
        currentFilters={filters as Record<string, unknown>}
        title="Filter orders"
      />

      <ReasonDialog
        visible={cancelling !== null}
        title={`Cancel order ${cancelling?.order_number ?? ''}?`}
        message="EduCard will stop working on it. This cannot be undone. The school admins, the class teachers and EduCard are emailed."
        confirmText="Cancel order"
        cancelText="Keep order"
        destructive
        isLoading={updateStatus.isPending}
        onCancel={() => setCancelling(null)}
        onConfirm={reason => cancelling && handleCancel(cancelling, reason)}
      />
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
  count: { fontSize: 13, color: '#4b5563', marginBottom: 10 },
  dimmed: { opacity: 0.6 },
  footer: { paddingVertical: 16 },
  emptyWrap: { flex: 1 },
  clearButton: {
    alignSelf: 'center',
    marginTop: -24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  clearButtonText: { fontSize: 15, fontWeight: '600', color: '#111827' },
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
  stepText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  cancelledBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  cancelledTitle: { fontSize: 13, fontWeight: '700', color: '#991b1b' },
  cancelledMeta: { fontSize: 12, color: '#b91c1c', marginTop: 2 },
  cancelledReason: {
    fontSize: 12,
    color: '#7f1d1d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 6 },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
});
