/**
 * Store Cart Screen - review lines and place the order
 */

import type { CartItem } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ShoppingCart, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/common';
import { EmptyState, LoadingState } from '@/components/common/ListStates';
import {
  useCart,
  useClearCart,
  usePlaceOrder,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/features/store';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function describeConfiguration(item: CartItem): string {
  return Object.entries(item.configuration ?? {})
    .map(([code, value]) =>
      Array.isArray(value)
        ? `${code}: ${value.length} selected`
        : `${code}: ${value}`,
    )
    .join(' · ');
}

export default function StoreCartScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clear = useClearCart();
  const place = usePlaceOrder();

  const cart = data?.data;
  const items = cart?.items ?? [];

  const handlePlaceOrder = () => {
    place.mutate(
      { notes },
      {
        onSuccess: response => {
          showToast('success', `Order ${response.data.order_number} placed`);
          setNotes('');
          navigation.navigate('StoreOrders');
        },
        onError: () => showToast('error', 'Could not place this order'),
      },
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const summary = describeConfiguration(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.product_name}</Text>
            {summary ? <Text style={styles.cardMeta}>{summary}</Text> : null}
            <Text style={styles.cardMeta}>
              {formatCurrency(item.unit_price)} each
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => removeItem.mutate(item.public_id)}
            accessibilityLabel={`Remove ${item.product_name}`}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                updateItem.mutate({
                  publicId: item.public_id,
                  quantity: Math.max(1, item.quantity - 1),
                })
              }
            >
              <Text style={styles.stepperText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                updateItem.mutate({
                  publicId: item.public_id,
                  quantity: item.quantity + 1,
                })
              }
            >
              <Text style={styles.stepperText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.lineTotal}>
            {formatCurrency(item.line_total)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={() => clear.mutate(undefined)}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isLoading ? (
        <LoadingState color="#2563eb" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={40} color="#9ca3af" />}
          message="Your cart is empty"
          subMessage="Browse the store to add products."
        />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item.public_id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(cart?.subtotal ?? 0)}
              </Text>
            </View>
            <TextInput
              style={styles.notes}
              placeholder="Notes for the supplier (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <SubmitButton
              label="Place order"
              onPress={handlePlaceOrder}
              isLoading={place.isPending}
            />
          </View>
        </>
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
  clearText: { fontSize: 14, fontWeight: '600', color: '#ef4444' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardInfo: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 18, color: '#111827' },
  quantity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },
  lineTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 15, color: '#6b7280' },
  summaryValue: { fontSize: 17, fontWeight: '700', color: '#111827' },
  notes: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
  },
});
