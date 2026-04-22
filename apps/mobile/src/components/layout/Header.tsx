/**
 * Header Component with gradient background
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { ChevronLeft, Bell, Settings, LucideIcon } from 'lucide-react-native';

import { Colors } from '@/constants/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  transparent?: boolean;
  light?: boolean;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  showNotifications = false,
  showSettings = false,
  rightIcon: RightIcon,
  onRightIconPress,
  transparent = false,
  light = false,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const textColor = light || transparent ? '#ffffff' : Colors.text.primary;
  const iconColor = light || transparent ? '#ffffff' : Colors.secondary[600];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const content = (
    <View className="flex-row items-center justify-between px-4 py-3">
      {/* Left Section */}
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2 mr-2"
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={iconColor} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text
            className="text-xl font-bold"
            style={{ color: textColor }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="text-sm mt-0.5"
              style={{ color: light || transparent ? 'rgba(255,255,255,0.8)' : Colors.text.secondary }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right Section */}
      <View className="flex-row items-center gap-2">
        {showNotifications && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(parent)/notifications' as any)}
            className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
            activeOpacity={0.7}
          >
            <Bell size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        {showSettings && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(admin)/settings' as any)}
            className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
            activeOpacity={0.7}
          >
            <Settings size={20} color={iconColor} />
          </TouchableOpacity>
        )}
        {RightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="w-10 h-10 rounded-full items-center justify-center bg-white/10"
            activeOpacity={0.7}
          >
            <RightIcon size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (transparent) {
    return content;
  }

  if (light) {
    return (
      <LinearGradient
        colors={[Colors.primary[600], Colors.primary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View className="bg-white border-b border-secondary-100">
      {content}
    </View>
  );
}

export default Header;
