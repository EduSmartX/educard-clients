/**
 * KeyboardAwareForm - Wrapper component that handles keyboard avoiding for forms
 * 
 * This component ensures that form inputs are visible when the keyboard is open,
 * especially on Android where KeyboardAvoidingView alone doesn't work well.
 * 
 * Features:
 * - Automatically scrolls to focused input
 * - Works on both iOS and Android
 * - Supports extra scroll height for better visibility
 * - Can be used as a drop-in replacement for ScrollView in forms
 */

import React from 'react';
import { Platform, StyleSheet, type ViewStyle, type StyleProp, type RefreshControlProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface KeyboardAwareFormProps {
  children: React.ReactNode;
  /** Style for the container */
  style?: StyleProp<ViewStyle>;
  /** Style for the content container */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra height to scroll when keyboard appears (default: 80) */
  extraScrollHeight?: number;
  /** Extra height specifically for Android (default: 120) */
  extraScrollHeightAndroid?: number;
  /** Whether to enable keyboard dismiss on scroll (default: false) */
  keyboardDismissOnScroll?: boolean;
  /** Whether to enable auto scroll to focused input (default: true) */
  enableAutoScrollToFocusedInput?: boolean;
  /** Ref to the scroll view */
  scrollRef?: React.RefObject<KeyboardAwareScrollView>;
  /** Show vertical scroll indicator (default: false) */
  showsVerticalScrollIndicator?: boolean;
  /** Keyboard should persist taps mode (default: 'handled') */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  /** Called when content size changes */
  onContentSizeChange?: (w: number, h: number) => void;
  /** Called on scroll */
  onScroll?: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;
  /** Enable bounce (default: true on iOS) */
  bounces?: boolean;
  /** Header component to render above the scroll content */
  stickyHeader?: React.ReactNode;
  /** RefreshControl component */
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function KeyboardAwareForm({
  children,
  style,
  contentContainerStyle,
  extraScrollHeight = 80,
  extraScrollHeightAndroid = 120,
  keyboardDismissOnScroll = false,
  enableAutoScrollToFocusedInput = true,
  scrollRef,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  onContentSizeChange,
  onScroll,
  bounces = Platform.OS === 'ios',
  stickyHeader,
  refreshControl,
}: KeyboardAwareFormProps) {
  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      enableOnAndroid={true}
      enableAutomaticScroll={enableAutoScrollToFocusedInput}
      extraScrollHeight={Platform.OS === 'android' ? extraScrollHeightAndroid : extraScrollHeight}
      extraHeight={Platform.OS === 'android' ? 150 : 100}
      keyboardOpeningTime={Platform.OS === 'ios' ? 250 : 0}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardDismissMode={keyboardDismissOnScroll ? 'on-drag' : 'none'}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={16}
      bounces={bounces}
      refreshControl={refreshControl}
    >
      {stickyHeader}
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Export the underlying component type for ref typing
export type { KeyboardAwareScrollView };
