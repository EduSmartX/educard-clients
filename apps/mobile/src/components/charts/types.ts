/**
 * Shared chart data types for the reusable chart components.
 */

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}
