/**
 * Pastel color palette for teacher timetable period rows.
 * Each row gets a gentle color to distinguish periods visually.
 */

export interface PeriodColorScheme {
  bg: string;
  border: string;
  text: string;
  sub: string;
}

export const PERIOD_PASTEL_COLORS: readonly PeriodColorScheme[] = [
  { bg: 'bg-pink-50', border: 'border-l-pink-300', text: 'text-pink-700', sub: 'text-pink-500' },
  {
    bg: 'bg-violet-50',
    border: 'border-l-violet-300',
    text: 'text-violet-700',
    sub: 'text-violet-500',
  },
  { bg: 'bg-sky-50', border: 'border-l-sky-300', text: 'text-sky-700', sub: 'text-sky-500' },
  { bg: 'bg-teal-50', border: 'border-l-teal-300', text: 'text-teal-700', sub: 'text-teal-500' },
  { bg: 'bg-rose-50', border: 'border-l-rose-300', text: 'text-rose-700', sub: 'text-rose-500' },
  {
    bg: 'bg-indigo-50',
    border: 'border-l-indigo-300',
    text: 'text-indigo-700',
    sub: 'text-indigo-500',
  },
  {
    bg: 'bg-fuchsia-50',
    border: 'border-l-fuchsia-300',
    text: 'text-fuchsia-700',
    sub: 'text-fuchsia-500',
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-300',
    text: 'text-emerald-700',
    sub: 'text-emerald-500',
  },
  {
    bg: 'bg-amber-50',
    border: 'border-l-amber-300',
    text: 'text-amber-700',
    sub: 'text-amber-500',
  },
  { bg: 'bg-cyan-50', border: 'border-l-cyan-300', text: 'text-cyan-700', sub: 'text-cyan-500' },
];

export function getPeriodColor(index: number): PeriodColorScheme {
  return PERIOD_PASTEL_COLORS[index % PERIOD_PASTEL_COLORS.length];
}
