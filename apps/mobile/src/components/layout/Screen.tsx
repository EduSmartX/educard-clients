/**
 * Screen Container Component
 * Handles safe area and common screen layout
 */

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
    <ScrollView
      className="flex-1"
      contentContainerClassName={`flex-grow ${contentContainerClassName}`}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${contentContainerClassName}`}>{children}</View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
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
