/**
 * Color schemes for class group cards
 * Rotates through visually distinct color sets
 */

export interface GroupColorScheme {
  bg: string;
  light: string;
  text: string;
  badge: string;
}

export const GROUP_COLORS: readonly GroupColorScheme[] = [
  {
    bg: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  {
    bg: 'from-blue-500 to-indigo-500',
    light: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    bg: 'from-violet-500 to-purple-500',
    light: 'bg-violet-50',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  {
    bg: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  {
    bg: 'from-rose-500 to-pink-500',
    light: 'bg-rose-50',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  {
    bg: 'from-cyan-500 to-sky-500',
    light: 'bg-cyan-50',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  },
] as const;
