/**
 * KeyboardAwareScrollView adapter (New Architecture / Fabric safe, no native deps).
 * Core ScrollView + KeyboardAvoidingView, replacing the abandoned
 * react-native-keyboard-aware-scroll-view (which called removed UIManager methods).
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type TargetedEvent,
  type ViewStyle,
} from 'react-native';

/** Gap kept between the focused input and the top of the keyboard. */
const DEFAULT_KEYBOARD_GAP = 24;

/** Never sit flush against the keyboard, even if a screen asks for a smaller gap. */
const MIN_KEYBOARD_GAP = 24;

/** Lets the row finish laying out (error text, expanding sections) before measuring. */
const MEASURE_DELAY_MS = 50;

/** Only the measure methods are needed off the focused host instance. */
type MeasurableInput = {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

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
    containerStyle?: StyleProp<ViewStyle>;
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
    extraKeyboardSpace,
    containerStyle,
    style,
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    scrollEventThrottle = 16,
    onScroll,
    onFocus,
    ...scrollViewProps
  },
  ref,
) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  /** Window Y of the keyboard's top edge; null while the keyboard is closed. */
  const keyboardTop = useRef<number | null>(null);
  const keyboardGap = Math.max(
    bottomOffset ??
      extraKeyboardSpace ??
      extraScrollHeight ??
      DEFAULT_KEYBOARD_GAP,
    MIN_KEYBOARD_GAP,
  );

  // Android only resizes the window; without this the focused field stays hidden.
  const revealFocusedInput = useCallback(() => {
    const keyboardY = keyboardTop.current;
    const scrollView = scrollRef.current;
    const input =
      TextInput.State.currentlyFocusedInput() as MeasurableInput | null;
    if (keyboardY === null || !scrollView || !input?.measureInWindow) {
      return;
    }
    input.measureInWindow((_x, y, _width, height) => {
      const hiddenBy = y + height + keyboardGap - keyboardY;
      if (hiddenBy <= 0) {
        return;
      }
      // A short form has no scroll range, so grow the content before scrolling.
      setKeyboardInset(previous => Math.max(previous, hiddenBy));
      const targetY = scrollOffsetY.current + hiddenBy;
      setTimeout(
        () => scrollRef.current?.scrollTo({ y: targetY, animated: true }),
        MEASURE_DELAY_MS,
      );
    });
  }, [keyboardGap]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent =
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const subscriptions = [
      Keyboard.addListener(showEvent, event => {
        keyboardTop.current = event.endCoordinates.screenY;
        revealFocusedInput();
      }),
      Keyboard.addListener(hideEvent, () => {
        keyboardTop.current = null;
        setKeyboardInset(0);
      }),
    ];

    return () => subscriptions.forEach(subscription => subscription.remove());
  }, [revealFocusedInput]);

  // Bubbled from descendant inputs only, so sibling scroll views never react.
  const handleFocus = useCallback(
    (event: NativeSyntheticEvent<TargetedEvent>) => {
      onFocus?.(event);
      setTimeout(revealFocusedInput, MEASURE_DELAY_MS);
    },
    [onFocus, revealFocusedInput],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetY.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll],
  );

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
      style={containerStyle ?? styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={style}
        contentContainerStyle={[
          contentContainerStyle,
          keyboardInset > 0 && { paddingBottom: keyboardInset },
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={handleScroll}
        onFocus={handleFocus}
        {...scrollViewProps}
      />
    </KeyboardAvoidingView>
  );
});

/** Back-compat type alias so `useRef<KeyboardAwareScrollView>()` keeps working. */
export type KeyboardAwareScrollView = KeyboardAwareScrollViewHandle;

const styles = StyleSheet.create({ flex: { flex: 1 } });
