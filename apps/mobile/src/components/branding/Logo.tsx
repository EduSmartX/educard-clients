/**
 * Logo Component for EduCard Mobile App
 * Displays the EduCard logo with various size options
 */
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@educard/shared';

interface LogoProps {
  /** Logo size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show text fallback instead of image */
  variant?: 'image' | 'text';
  /** Show glow effect */
  withGlow?: boolean;
  /** Show ring effect */
  withRing?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

const sizeMap = {
  sm: { container: 48, text: 16 },
  md: { container: 64, text: 24 },
  lg: { container: 80, text: 32 },
  xl: { container: 96, text: 40 },
};

export function Logo({
  size = 'md',
  variant = 'image',
  withGlow = false,
  withRing = false,
  style,
}: LogoProps) {
  const dimensions = sizeMap[size];

  if (variant === 'text') {
    return (
      <View style={[styles.container, style]}>
        {withGlow && (
          <View
            style={[
              styles.glow,
              {
                width: dimensions.container + 20,
                height: dimensions.container + 20,
              },
            ]}
          />
        )}
        <View
          style={[
            styles.textContainer,
            {
              width: dimensions.container,
              height: dimensions.container,
              borderRadius: dimensions.container / 2,
            },
            withRing && styles.ring,
          ]}
        >
          <Text style={[styles.fallbackText, { fontSize: dimensions.text }]}>EC</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {withGlow && (
        <View
          style={[
            styles.glow,
            {
              width: dimensions.container + 20,
              height: dimensions.container + 20,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.imageContainer,
          {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
          },
          withRing && styles.ring,
        ]}
      >
        <Image
          source={require('../../../assets/images/educard-logo.jpg')}
          style={[
            styles.image,
            {
              width: dimensions.container - 4,
              height: dimensions.container - 4,
              borderRadius: (dimensions.container - 4) / 2,
            },
          ]}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.primary[400],
    opacity: 0.3,
    borderRadius: 100,
  },
  imageContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    backgroundColor: '#fff',
  },
  textContainer: {
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fallbackText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ring: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});

export default Logo;
