/**
 * A product's photos for the whole school or one class. The starred photo is what the
 * catalog and cart show, and what EduCard makes.
 */
import { getErrorMessage, type ProductPhoto } from '@educard/shared';
import { ImagePlus, Star, Trash2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMediaUrl } from '@/constants/config';
import { showToast } from '@/utils/toast';

import {
  useAddProductPhoto,
  useRemoveProductPhoto,
  useSetPrimaryProductPhoto,
} from '../hooks/use-store';
import { pickStoreImage } from '../utils/pick-image';
import { storeStyles as s } from './store-styles';

/** EduCard's per-scope cap (StoreLimits.MAX_PRODUCT_IMAGES). */
const MAX_PHOTOS = 8;

interface ProductPhotoGridProps {
  productPublicId: string;
  photos: ProductPhoto[];
  /** Any section of the grade; omit for school-wide photos. */
  classPublicId?: string;
  emptyHint: string;
}

export function ProductPhotoGrid({
  productPublicId,
  photos,
  classPublicId,
  emptyHint,
}: ProductPhotoGridProps) {
  const add = useAddProductPhoto(productPublicId);
  const makePrimary = useSetPrimaryProductPhoto(productPublicId);
  const remove = useRemoveProductPhoto(productPublicId);
  const onError = (error: unknown) =>
    showToast('error', getErrorMessage(error, 'Something went wrong'));

  const handleAdd = async () => {
    const image = await pickStoreImage();
    if (!image) {
      return;
    }
    add.mutate(
      { image, classPublicIds: classPublicId ? [classPublicId] : [] },
      { onSuccess: () => showToast('success', 'Photo added'), onError },
    );
  };

  return (
    <View>
      {photos.length === 0 ? (
        <Text style={[s.hint, styles.empty]}>{emptyHint}</Text>
      ) : (
        <View style={styles.grid}>
          {photos.map(photo => (
            <View
              key={photo.public_id}
              style={[styles.tile, photo.is_primary && styles.tilePrimary]}
            >
              <Image
                source={{ uri: getMediaUrl(photo.image_url) }}
                style={styles.image}
                resizeMode="contain"
              />
              {photo.is_primary && <Text style={styles.shown}>Shown</Text>}
              <View style={styles.actions}>
                {!photo.is_primary && (
                  <TouchableOpacity
                    style={styles.action}
                    onPress={() =>
                      makePrimary.mutate(photo.public_id, { onError })
                    }
                    accessibilityLabel="Show this photo"
                  >
                    <Star size={14} color="#111827" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.action}
                  onPress={() => remove.mutate(photo.public_id, { onError })}
                  accessibilityLabel="Remove photo"
                >
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[
          s.secondaryButton,
          photos.length >= MAX_PHOTOS && styles.disabled,
        ]}
        disabled={add.isPending || photos.length >= MAX_PHOTOS}
        onPress={() => void handleAdd()}
      >
        {add.isPending ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <ImagePlus size={16} color="#2563eb" />
        )}
        <Text style={s.secondaryButtonText}>
          {photos.length >= MAX_PHOTOS
            ? `Up to ${MAX_PHOTOS} photos`
            : 'Add photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tile: {
    width: 92,
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  tilePrimary: { borderColor: '#2563eb', borderWidth: 2 },
  image: { width: '100%', height: '100%' },
  shown: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  actions: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  action: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    padding: 5,
  },
  disabled: { opacity: 0.5 },
});
