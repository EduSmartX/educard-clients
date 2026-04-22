/**
 * Avatar Component
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';

import { Colors } from '@/constants/colors';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  showBadge?: boolean;
  badgeColor?: string;
}

const sizeConfig: Record<AvatarSize, { container: number; text: string; icon: number }> = {
  xs: { container: 24, text: 'text-xs', icon: 12 },
  sm: { container: 32, text: 'text-sm', icon: 16 },
  md: { container: 40, text: 'text-base', icon: 20 },
  lg: { container: 56, text: 'text-xl', icon: 28 },
  xl: { container: 80, text: 'text-3xl', icon: 40 },
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    Colors.primary[500],
    Colors.success[500],
    Colors.warning[500],
    Colors.danger[500],
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  source,
  name = '',
  size = 'md',
  showBadge = false,
  badgeColor = Colors.success[500],
}: AvatarProps) {
  const config = sizeConfig[size];
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <View className="relative">
      {source ? (
        <Image
          source={{ uri: source }}
          style={{
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
          }}
          contentFit="cover"
          transition={200}
        />
      ) : initials ? (
        <View
          className="items-center justify-center"
          style={{
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
            backgroundColor: bgColor,
          }}
        >
          <Text className={`font-semibold text-white ${config.text}`}>{initials}</Text>
        </View>
      ) : (
        <View
          className="items-center justify-center bg-secondary-200"
          style={{
            width: config.container,
            height: config.container,
            borderRadius: config.container / 2,
          }}
        >
          <User size={config.icon} color={Colors.secondary[500]} />
        </View>
      )}

      {/* Online Badge */}
      {showBadge && (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2 border-white"
          style={{
            width: config.container * 0.3,
            height: config.container * 0.3,
            backgroundColor: badgeColor,
          }}
        />
      )}
    </View>
  );
}

export default Avatar;
