/**
 * Store Catalog Screen - browse and configure products for a bulk order
 */

import { PRODUCT_KIND, type CatalogProduct } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Settings2, ShoppingCart } from 'lucide-react-native';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { getMediaUrl } from '@/constants/config';
import { formatCurrency, useCart, useCatalog } from '@/features/store';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

export default function StoreCatalogScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useCatalog();
  const { data: cartResponse } = useCart();

  const products = data?.data ?? [];
  const cartCount = cartResponse?.data?.item_count ?? 0;

  const openProduct = (product: CatalogProduct) => {
    if (!product.is_published) {
      showToast('info', `Set up and publish ${product.name} first.`);
      navigation.navigate('StoreProductSetup', {
        productId: product.public_id,
      });
      return;
    }
    navigation.navigate('StoreOrder', { productId: product.public_id });
  };

  const renderProduct = ({ item }: { item: CatalogProduct }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openProduct(item)}
      activeOpacity={0.8}
    >
      {item.image_url ? (
        <Image
          source={{ uri: getMediaUrl(item.image_url) }}
          style={styles.thumb}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.category_name}</Text>
        <Text style={styles.cardPrice}>
          {item.kind === PRODUCT_KIND.BOOK_SET
            ? 'Priced per class'
            : `${formatCurrency(item.price)} / ${item.unit_label}`}
        </Text>
        {!item.is_published && (
          <Text style={styles.setupRequired}>
            Not published · tap to set up
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('StoreSetup')}
            accessibilityLabel="Store setup"
          >
            <Settings2 size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('StoreCart')}
            accessibilityLabel="Cart"
          >
            <View>
              <ShoppingCart size={22} color="#111827" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <LoadingState color="#2563eb" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={40} color="#9ca3af" />}
          message="No products available"
          subMessage="No store products have been enabled for your school yet."
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.public_id}
          renderItem={renderProduct}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  thumb: { width: 88, height: 88 },
  thumbFallback: { backgroundColor: '#f3f4f6' },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  setupRequired: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
