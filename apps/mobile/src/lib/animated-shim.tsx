/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Drop-in replacement for react-native-reanimated
 * Uses plain React Native Animated API instead of reanimated TurboModules
 * This avoids the "installTurboModule" crash in Expo Go
 *
 * Note: This shim file intentionally uses `any` types to match
 * the reanimated API signatures for drop-in compatibility.
 */

import React from 'react';
import { View, Text, ScrollView, FlatList, Image, Animated as RNAnimated } from 'react-native';

// Re-export plain View as Animated default
const _AnimatedView = RNAnimated.View;
const _AnimatedText = RNAnimated.Text;
const _AnimatedScrollView = RNAnimated.ScrollView;
const _AnimatedFlatList = RNAnimated.FlatList;
const _AnimatedImage = RNAnimated.Image;

// Chainable no-op animation object that supports .delay(), .duration(), .springify(), etc.
function createChainableAnimation(): any {
  const obj: any = {};
  const chainable = new Proxy(obj, {
    get(_target, prop) {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
        return () => '';
      }
      // Any method call returns the same chainable proxy
      return (..._args: any[]) => chainable;
    },
  });
  return chainable;
}

const FadeIn = createChainableAnimation();
const FadeInDown = createChainableAnimation();
const FadeInUp = createChainableAnimation();
const FadeInRight = createChainableAnimation();
const FadeInLeft = createChainableAnimation();
const FadeOut = createChainableAnimation();
const FadeOutDown = createChainableAnimation();
const FadeOutUp = createChainableAnimation();
const SlideInRight = createChainableAnimation();
const SlideInLeft = createChainableAnimation();
const SlideOutRight = createChainableAnimation();
const SlideOutLeft = createChainableAnimation();
const ZoomIn = createChainableAnimation();
const ZoomOut = createChainableAnimation();
const BounceIn = createChainableAnimation();
const BounceOut = createChainableAnimation();
const Layout = createChainableAnimation();
const LinearTransition = createChainableAnimation();

// Create a wrapper that strips reanimated-specific props (entering, exiting, layout)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createAnimatedComponent(BaseComponent: React.ComponentType<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnimatedWrapper = React.forwardRef<unknown, any>((props, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { entering, exiting, layout: layoutProp, ...rest } = props;
    return <BaseComponent ref={ref} {...rest} />;
  });
  AnimatedWrapper.displayName = `Animated(${BaseComponent.displayName ?? BaseComponent.name ?? 'Component'})`;
  return AnimatedWrapper;
}

const Animated = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  ScrollView: createAnimatedComponent(ScrollView),
  FlatList: createAnimatedComponent(FlatList),
  Image: createAnimatedComponent(Image),
  createAnimatedComponent,
};

// useAnimatedStyle - just return the style as-is
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useAnimatedStyle(styleFactory: () => any, _deps?: unknown[]) {
  return styleFactory();
}

// useSharedValue - simple ref-based replacement
function useSharedValue(initialValue: any) {
  return { value: initialValue };
}

// withTiming / withSpring / withDelay - just return target value
function withTiming(toValue: any, _config?: any, _callback?: any) {
  return toValue;
}
function withSpring(toValue: any, _config?: any, _callback?: any) {
  return toValue;
}
function withDelay(_delay: number, animation: any) {
  return animation;
}
function withSequence(...animations: any[]) {
  return animations[animations.length - 1];
}
function withRepeat(animation: any) {
  return animation;
}

// Easing replacements
const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  bezier: () => (t: number) => t,
  in: () => (t: number) => t,
  out: () => (t: number) => t,
  inOut: () => (t: number) => t,
};

// interpolate
function interpolate(value: number, inputRange: number[], outputRange: number[]) {
  // Simple linear interpolation
  if (inputRange.length < 2) return outputRange[0] ?? 0;
  const ratio = (value - inputRange[0]) / (inputRange[inputRange.length - 1] - inputRange[0]);
  return outputRange[0] + ratio * (outputRange[outputRange.length - 1] - outputRange[0]);
}

// runOnJS / runOnUI - just call the function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runOnJS<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runOnUI<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

// useAnimatedScrollHandler
interface ScrollHandlers {
  onScroll?: () => void;
}
function useAnimatedScrollHandler(handlers: ScrollHandlers) {
  return handlers?.onScroll ?? (() => {});
}

export default Animated;
export {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  FadeInLeft,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  SlideInRight,
  SlideInLeft,
  SlideOutRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
  BounceIn,
  BounceOut,
  Layout,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedScrollHandler,
  createAnimatedComponent,
};
