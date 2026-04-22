/**
 * Loading Spinner Component
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

import { Colors } from '@/constants/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color = Colors.primary[500],
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <View className="items-center justify-center">
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-secondary-500 mt-3 text-sm">{text}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        {content}
      </View>
    );
  }

  return content;
}

export default LoadingSpinner;
