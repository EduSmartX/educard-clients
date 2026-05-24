/**
 * HeaderProfileButton — Profile image button for screen headers
 * Shows user's profile image or fallback icon, navigates to settings
 */

import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { User } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { getMyProfilePhoto } from '@/api/profile';
import { getMediaUrl } from '@/constants/config';

interface HeaderProfileButtonProps {
  /** Route to navigate to on press (default: settings) */
  route?: Href;
  /** Size of the button (default: 44) */
  size?: number;
}

export function HeaderProfileButton({
  route = '/(tabs)/(admin)/settings' as Href,
  size = 44,
}: HeaderProfileButtonProps) {
  const router = useRouter();

  // Inline the profile photo query to avoid circular dependency through useProfile hook
  const { data: profilePhoto, dataUpdatedAt } = useQuery({
    queryKey: ['profile-photo', 'header-button'],
    queryFn: getMyProfilePhoto,
    staleTime: 5 * 60 * 1000,
  });

  // Build profile image URL with cache-busting
  const serverUrl = getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);
  const separator = serverUrl?.includes('?') ? '&' : '?';
  const profileImageUrl = serverUrl
    ? `${serverUrl}${separator}v=${dataUpdatedAt || Date.now()}`
    : undefined;

  const borderRadius = size * 0.34; // ~15 for size 44

  return (
    <TouchableOpacity
      style={[styles.button, { width: size, height: size, borderRadius }]}
      onPress={() => router.push(route)}
      activeOpacity={0.8}
    >
      {profileImageUrl ? (
        <Image
          source={{ uri: profileImageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.fallback}>
          <User size={size * 0.64} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
