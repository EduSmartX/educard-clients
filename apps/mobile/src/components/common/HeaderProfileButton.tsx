/**
 * HeaderProfileButton — Profile image button for screen headers
 * Shows user's profile image or fallback icon, navigates to settings
 */

import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';

import { getMyProfilePhoto } from '@/api/profile';
import { getMediaUrl } from '@/constants/config';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { AdminTabParamList } from '@/navigation/types';

interface HeaderProfileButtonProps {
  /** Screen to navigate to on press (default: Settings tab) */
  screen?: MenuTarget;
  /** Size of the button (default: 44) */
  size?: number;
}

export function HeaderProfileButton({
  screen = 'Settings',
  size = 44,
}: HeaderProfileButtonProps) {
  const navigation =
    useNavigation<BottomTabNavigationProp<AdminTabParamList>>();

  const { data: profilePhoto, dataUpdatedAt } = useQuery({
    queryKey: ['profile-photo', 'header-button'],
    queryFn: getMyProfilePhoto,
    staleTime: 5 * 60 * 1000,
  });

  const serverUrl =
    getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);
  const separator = serverUrl?.includes('?') ? '&' : '?';
  const profileImageUrl = serverUrl
    ? `${serverUrl}${separator}v=${dataUpdatedAt || Date.now()}`
    : undefined;

  const borderRadius = size * 0.34;

  const handlePress = () => {
    navigateToScreen(navigation, screen);
  };

  return (
    <TouchableOpacity
      style={[styles.button, { width: size, height: size, borderRadius }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {profileImageUrl ? (
        <Image
          source={{ uri: profileImageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          resizeMode="cover"
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
