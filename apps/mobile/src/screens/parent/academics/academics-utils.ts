import { format } from 'date-fns';

// date-fns `format` throws on invalid/missing values; never let API data crash a screen.
export function safeFormat(
  value: string | number | Date | null | undefined,
  pattern: string,
  fallback = '—',
): string {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : format(parsed, pattern);
}
