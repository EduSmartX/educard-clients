/**
 * Store Setup > Products: every product EduCard offers the school, its status
 * (draft / published) and what is still needed before it can be ordered.
 */
import type { CatalogProduct } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, ImageOff } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { productImageUrl, useCatalog } from '@/features/store';
import { ORDER_COLOURS } from '@/features/store/components/OrderParts';
import { storeStyles as s } from '@/features/store/components/store-styles';
import type { SharedStackNavigation } from '@/navigation/types';

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <Text
      style={[
        styles.badge,
        published
          ? {
              backgroundColor: ORDER_COLOURS.successSoft,
              color: ORDER_COLOURS.success,
            }
          : {
              backgroundColor: ORDER_COLOURS.warningSoft,
              color: ORDER_COLOURS.warning,
            },
      ]}
    >
      {published ? 'Published' : 'Draft'}
    </Text>
  );
}

function ProductRow({ product }: { product: CatalogProduct }) {
  const navigation = useNavigation<SharedStackNavigation>();
  return (
    <TouchableOpacity
      style={[s.card, styles.row]}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('StoreProductSetup', {
          productId: product.public_id,
        })
      }
    >
      <View style={styles.thumb}>
        {productImageUrl(product) ? (
          <Image
            source={{ uri: productImageUrl(product) }}
            style={styles.thumbImage}
            resizeMode="contain"
          />
        ) : (
          <ImageOff size={20} color="#9ca3af" />
        )}
      </View>
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text style={[s.cardTitle, styles.flex]} numberOfLines={1}>
            {product.name}
          </Text>
          <PublishBadge published={product.is_published} />
        </View>
        <Text style={s.hint}>
          {product.is_customized ? 'Customised' : 'EduCard default'} ·{' '}
          {product.category_name}
        </Text>
        {!product.is_published && (
          <Text
            style={[
              styles.status,
              {
                color:
                  product.publish_blockers.length > 0
                    ? ORDER_COLOURS.warning
                    : ORDER_COLOURS.success,
              },
            ]}
            numberOfLines={2}
          >
            {product.publish_blockers.length > 0
              ? `Needs: ${product.publish_blockers.join(', ')}`
              : 'Ready to publish'}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

export function ProductLooksSetup() {
  const { data, isLoading } = useCatalog({ page_size: 100 });
  const products = data?.data ?? [];
  const published = products.filter(product => product.is_published).length;

  if (isLoading) {
    return <ActivityIndicator color={ORDER_COLOURS.accent} />;
  }
  if (products.length === 0) {
    return (
      <Text style={s.hint}>
        EduCard has not offered any products to your school yet.
      </Text>
    );
  }
  return (
    <View>
      <Text style={[s.hint, styles.intro]}>
        Review each product, fill in what EduCard needs, then publish it to
        start ordering. {published} of {products.length} published.
      </Text>
      {products.map(product => (
        <ProductRow key={product.public_id} product={product} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { fontSize: 12, marginTop: 4 },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
