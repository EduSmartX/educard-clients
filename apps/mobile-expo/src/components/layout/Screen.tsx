/**
 * Screen Container Component
 * Handles safe area and common screen layout
 */

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeArea?: boolean;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  keyboardAvoiding?: boolean;
  contentContainerClassName?: string;
}

export function Screen({
  children,
  scrollable = false,
  safeArea = true,
  statusBarStyle = 'dark',
  backgroundColor = '#ffffff',
  edges = ['top'],
  keyboardAvoiding = false,
  contentContainerClassName = '',
}: ScreenProps) {
  const Container = safeArea ? SafeAreaView : View;

  const content = scrollable ? (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName={`flex-grow ${contentContainerClassName}`}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View className={`flex-1 ${contentContainerClassName}`}>{children}</View>
  );

  // KeyboardAwareScrollView already handles keyboard avoidance when scrollable
  const wrappedContent =
    keyboardAvoiding && !scrollable ? (
      <KeyboardAwareScrollView
        className="flex-1"
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </KeyboardAwareScrollView>
    ) : (
      content
    );

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Container className="flex-1" style={{ backgroundColor }} edges={edges}>
        {wrappedContent}
      </Container>
    </>
  );
}

export default Screen;
