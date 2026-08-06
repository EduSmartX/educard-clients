/**
 * KeyboardAwareScrollView adapter (New Architecture / Fabric safe).
 *
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView as KCKeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

export interface KeyboardAwareScrollViewHandle {
  scrollToPosition: (x: number, y: number, animated?: boolean) => void;
  scrollToEnd: (animated?: boolean) => void;
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  assureFocusedInputVisible: () => void;
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
    extraScrollHeight,
    extraScrollHeightAndroid: _extraScrollHeightAndroid,
    extraHeight: _extraHeight,
    keyboardOpeningTime: _keyboardOpeningTime,
    viewIsInsideTabBar: _viewIsInsideTabBar,
    innerRef: _innerRef,
    bottomOffset,
    ...scrollViewProps
  },
  ref,
) {
  const kcRef = useRef<KeyboardAwareScrollViewRef>(null);

  useImperativeHandle(
    ref,
    () => ({
      scrollToPosition: (x, y, animated = true) =>
        kcRef.current?.scrollTo({ x, y, animated }),
      scrollToEnd: (animated = true) =>
        kcRef.current?.scrollToEnd({ animated }),
      scrollTo: options => kcRef.current?.scrollTo(options),
      assureFocusedInputVisible: () =>
        kcRef.current?.assureFocusedInputVisible(),
    }),
    [],
  );

  return (
    <KCKeyboardAwareScrollView
      ref={kcRef}
      bottomOffset={bottomOffset ?? extraScrollHeight ?? 20}
      {...scrollViewProps}
    />
  );
});

/** Back-compat type alias so `useRef<KeyboardAwareScrollView>()` keeps working. */
export type KeyboardAwareScrollView = KeyboardAwareScrollViewHandle;
