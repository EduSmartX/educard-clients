/**
 * KeyboardAwareForm - Wrapper component that handles keyboard avoiding for forms
 *
 * Ensures form inputs stay visible when the keyboard is open (especially Android).
 * Drop-in replacement for ScrollView in forms.
 */

import React from 'react';
import {
  Platform,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type RefreshControlProps,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';

interface KeyboardAwareFormProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraScrollHeight?: number;
  extraScrollHeightAndroid?: number;
  keyboardDismissOnScroll?: boolean;
  enableAutoScrollToFocusedInput?: boolean;
  scrollRef?: React.RefObject<KeyboardAwareScrollView>;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  onContentSizeChange?: (w: number, h: number) => void;
  bounces?: boolean;
  stickyHeader?: React.ReactNode;
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
  bounces = Platform.OS === 'ios',
  stickyHeader,
  refreshControl,
}: KeyboardAwareFormProps) {
  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={[styles.container, style]}
      contentContainerStyle={contentContainerStyle}
      enableOnAndroid
      enableAutomaticScroll={enableAutoScrollToFocusedInput}
      extraScrollHeight={
        Platform.OS === 'android' ? extraScrollHeightAndroid : extraScrollHeight
      }
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

export type { KeyboardAwareScrollView };
