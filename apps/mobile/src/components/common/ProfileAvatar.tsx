/**
 * ProfileAvatar — Large circular avatar with image or initials fallback
 * Used on View and Edit detail screens for teachers/students.
 * When `onPress` is provided, shows a camera edit overlay.
 */

import { Colors } from '@educard/shared';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';

import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { getMediaUrl } from '@/constants/config';

interface ProfileAvatarProps {
  /** Full name to derive initials from */
  name?: string;
  /** Direct image URI (profile_photo_thumbnail) */
  imageUri?: string | null;
  /** Full-size original opened when tapped in read-only mode */
  fullImageUri?: string | null;
  /** Size in pixels (default 90) */
  size?: number;
  /** Background color for initials fallback */
  bgColor?: string;
  /** If provided, avatar becomes tappable with a camera overlay */
  onPress?: () => void;
  /** Show a spinner overlay while uploading */
  isUploading?: boolean;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + (parts.at(-1) ?? parts[0])[0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export function ProfileAvatar({
  name,
  imageUri,
  fullImageUri,
  size = 90,
  bgColor = Colors.primary[100],
  onPress,
  isUploading,
}: ProfileAvatarProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const fontSize = size * 0.36;
  const borderRadius = size / 2;
  const badgeSize = size * 0.32;

  // Backend serves signed URLs; no cache-bust param (would break the signature).
  const resolvedUri = getMediaUrl(imageUri);
  const resolvedFullUri = getMediaUrl(fullImageUri) ?? resolvedUri;

  const sizeStyle = { width: size, height: size, borderRadius };
  const badgeStyle = {
    width: badgeSize,
    height: badgeSize,
    borderRadius: badgeSize / 2,
  };

  const content = resolvedUri ? (
    <Image
      source={{ uri: resolvedUri }}
      style={[styles.image, sizeStyle]}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        styles.initialsContainer,
        sizeStyle,
        { backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );

  const overlay = isUploading ? (
    <View style={[styles.uploadingOverlay, sizeStyle]}>
      <ActivityIndicator size="small" color="#fff" />
    </View>
  ) : null;

  const badge =
    onPress && !isUploading ? (
      <View style={[styles.cameraBadge, styles.cameraBadgeAnchor, badgeStyle]}>
        <Camera size={badgeSize * 0.55} color="#fff" />
      </View>
    ) : null;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isUploading}
      >
        <View style={sizeStyle}>
          {content}
          {overlay}
          {badge}
        </View>
      </TouchableOpacity>
    );
  }

  // Read-only: tapping enlarges the photo instead of doing nothing.
  if (resolvedUri) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setViewerOpen(true)}
          activeOpacity={0.8}
        >
          <View style={sizeStyle}>{content}</View>
        </TouchableOpacity>
        <ImageViewerModal
          visible={viewerOpen}
          uri={resolvedFullUri}
          title={name}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  initialsText: {
    fontWeight: '700',
    color: Colors.primary[700],
  },
  cameraBadge: {
    position: 'absolute',
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraBadgeAnchor: {
    bottom: 0,
    right: 0,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
