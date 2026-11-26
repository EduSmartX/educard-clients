/**
 * A rendered ID card side exactly as it will print (PNG from the server).
 */
import type { CardOrientation } from '@educard/shared';
import { IdCard } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useCardPreview } from '../hooks/use-store';

interface CardPreviewImageProps {
  path: string | undefined;
  student?: string;
  orientation?: CardOrientation;
  width?: number;
  style?: StyleProp<ViewStyle>;
}

/** CR80 card: 85.6 x 54 mm. */
const CARD_RATIO = 85.6 / 54;

export function CardPreviewImage({
  path,
  student,
  orientation = 'landscape',
  width = 220,
  style,
}: CardPreviewImageProps) {
  const { data, isLoading, isError } = useCardPreview(path, student);
  const landscape = orientation === 'landscape';
  const size = landscape
    ? { width, height: width / CARD_RATIO }
    : { width: width / CARD_RATIO, height: width };

  return (
    <View style={[styles.frame, size, style]}>
      {data && !isError ? (
        <Image source={{ uri: data }} style={size} resizeMode="contain" />
      ) : isLoading && path ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        <IdCard size={28} color="#9ca3af" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
