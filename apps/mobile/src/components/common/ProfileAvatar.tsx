/**
 * ProfileAvatar — Large circular avatar with image or initials fallback
 * Used on View and Edit detail screens for teachers/students
 * When `onPress` is provided, shows a camera edit overlay.
 */

import { Colors } from '@educard/shared';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import { getMediaUrl } from '@/constants/config';

interface ProfileAvatarProps {
  /** Full name to derive initials from */
  name?: string;
  /** Direct image URI (profile_photo_thumbnail) */
  imageUri?: string | null;
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
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export function ProfileAvatar({
  name,
  imageUri,
  size = 90,
  bgColor = Colors.primary[100],
  onPress,
  isUploading,
}: ProfileAvatarProps) {
  const fontSize = size * 0.36;
  const borderRadius = size / 2;
  const badgeSize = size * 0.32;

  const resolvedUri = getMediaUrl(imageUri);

  const content = resolvedUri ? (
    <Image
      source={{ uri: resolvedUri }}
      style={[styles.image, { width: size, height: size, borderRadius }]}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View
      style={[
        styles.initialsContainer,
        { width: size, height: size, borderRadius, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initialsText, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );

  const overlay = isUploading ? (
    <View style={[styles.uploadingOverlay, { width: size, height: size, borderRadius }]}>
      <ActivityIndicator size="small" color="#fff" />
    </View>
  ) : null;

  const badge =
    onPress && !isUploading ? (
      <View
        style={[
          styles.cameraBadge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            bottom: 0,
            right: 0,
          },
        ]}
      >
        <Camera size={badgeSize * 0.55} color="#fff" />
      </View>
    ) : null;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={isUploading}>
        <View style={{ width: size, height: size }}>
          {content}
          {overlay}
          {badge}
        </View>
      </TouchableOpacity>
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
