/**
 * ImageViewerModal — full-screen viewer for profile photos and other images.
 * Shows the image at the largest size the screen allows so faces stay legible,
 * instead of upscaling a small thumbnail in place.
 */

import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ImageViewerModalProps {
  visible: boolean;
  /** Fully resolved image URL; when empty the modal renders nothing. */
  uri?: string | null;
  title?: string;
  onClose: () => void;
}

export function ImageViewerModal({
  visible,
  uri,
  title,
  onClose,
}: ImageViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const { width, height } = Dimensions.get('window');
  const size = Math.min(width - 48, height * 0.6);

  if (!uri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <Image
            source={{ uri }}
            style={[styles.image, { width: size, height: size }]}
            resizeMode="cover"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          {!!title && <Text style={styles.title}>{title}</Text>}
        </Pressable>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={22} color="#fff" />
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  image: { borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  loader: { position: 'absolute', top: '50%', left: '50%' },
  title: {
    marginTop: 20,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
