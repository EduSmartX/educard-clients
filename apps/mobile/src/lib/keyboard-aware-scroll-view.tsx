/**
 * KeyboardAwareScrollView adapter (New Architecture / Fabric safe, no native deps).
 * Core ScrollView + KeyboardAvoidingView, replacing the abandoned
 * react-native-keyboard-aware-scroll-view (which called removed UIManager methods).
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';

export interface KeyboardAwareScrollViewHandle {
  scrollToPosition: (x: number, y: number, animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
}

/** Legacy props from the old library — accepted for back-compat, now handled natively. */
interface LegacyKeyboardAwareProps {
  enableOnAndroid?: boolean;
  enableAutomaticScroll?: boolean;
  enableResetScrollToCoords?: boolean;
  resetScrollToCoords?: { x: number; y: number };
  extraScrollHeight?: number;
  extraScrollHeightAndroid?: number;
  extraHeight?: number;
  keyboardOpeningTime?: number;
  viewIsInsideTabBar?: boolean;
  innerRef?: (ref: unknown) => void;
}

export type KeyboardAwareScrollViewProps = ScrollViewProps &
  LegacyKeyboardAwareProps & {
    /** Gap kept between the keyboard and the focused input. */
    bottomOffset?: number;
    extraKeyboardSpace?: number;
  };

export const KeyboardAwareScrollView = forwardRef<
  KeyboardAwareScrollViewHandle,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    enableOnAndroid: _enableOnAndroid,
    enableAutomaticScroll: _enableAutomaticScroll,
    enableResetScrollToCoords: _enableResetScrollToCoords,
    resetScrollToCoords: _resetScrollToCoords,
    extraScrollHeight: _extraScrollHeight,
    extraScrollHeightAndroid: _extraScrollHeightAndroid,
    extraHeight: _extraHeight,
    keyboardOpeningTime: _keyboardOpeningTime,
    viewIsInsideTabBar: _viewIsInsideTabBar,
    innerRef: _innerRef,
    bottomOffset: _bottomOffset,
    extraKeyboardSpace: _extraKeyboardSpace,
    style,
    keyboardShouldPersistTaps = 'handled',
    ...scrollViewProps
  },
  ref,
) {
  const scrollRef = useRef<ScrollView>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToPosition: (x, y, animated = true) =>
        scrollRef.current?.scrollTo({ x, y, animated }),
      scrollToEnd: (animated = true) =>
        scrollRef.current?.scrollToEnd({ animated }),
      scrollTo: options => scrollRef.current?.scrollTo(options),
    }),
    [],
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={style}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...scrollViewProps}
      />
    </KeyboardAvoidingView>
  );
});

/** Back-compat type alias so `useRef<KeyboardAwareScrollView>()` keeps working. */
export type KeyboardAwareScrollView = KeyboardAwareScrollViewHandle;

const styles = StyleSheet.create({ flex: { flex: 1 } });
