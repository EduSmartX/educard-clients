import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  gridColumns: number;
  statColumns: number;
  formColumns: number;
  horizontalPadding: number;
  cardWidth: (gap?: number) => number;
  fontScale: number;
  select: <T>(phone: T, tablet: T, largeTablet?: T) => T;
}

const TABLET_BREAKPOINT = 600;
const LARGE_TABLET_BREAKPOINT = 900;

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= TABLET_BREAKPOINT;
    const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
    const isLandscape = width > height;

    let gridColumns = 2;
    if (isLargeTablet) {
      gridColumns = 4;
    } else if (isTablet) {
      gridColumns = 3;
    }

    const statColumns = isLargeTablet || isTablet ? 4 : 2;
    const formColumns = isTablet ? 2 : 1;

    let horizontalPadding = 16;
    if (isLargeTablet) {
      horizontalPadding = 32;
    } else if (isTablet) {
      horizontalPadding = 24;
    }

    const fontScale = isTablet ? 1.1 : 1;

    const cardWidth = (gap = 12) => {
      const totalGaps = (gridColumns - 1) * gap;
      const totalPadding = horizontalPadding * 2;
      return (width - totalPadding - totalGaps) / gridColumns;
    };

    const select = <T>(phone: T, tablet: T, largeTablet?: T): T => {
      if (isLargeTablet && largeTablet !== undefined) return largeTablet;
      if (isTablet) return tablet;
      return phone;
    };

    return {
      width,
      height,
      isTablet,
      isLargeTablet,
      isLandscape,
      gridColumns,
      statColumns,
      formColumns,
      horizontalPadding,
      cardWidth,
      fontScale,
      select,
    };
  }, [width, height]);
}

export function rs<T>(isTablet: boolean, phone: T, tablet: T): T {
  return isTablet ? tablet : phone;
}
