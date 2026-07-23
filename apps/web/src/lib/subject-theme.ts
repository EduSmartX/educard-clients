/**
 * Subject Icon & Color Mapping
 * Maps subject names to icons, colors, and emoji for student-friendly visuals.
 *
 * Shared across roles (student/parent/teacher/admin) — used as the fallback
 * styling for `SubjectAvatar` when no subject illustration is available.
 */

import {
  FlaskConical,
  Calculator,
  Globe2,
  BookOpen,
  Languages,
  Monitor,
  Dumbbell,
  Palette,
  Music,
  Atom,
  Microscope,
  Beaker,
  TreePine,
  Scale,
  Landmark,
  Pen,
  Code,
  type LucideIcon,
} from 'lucide-react';

export interface SubjectTheme {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  emoji: string;
}

const SUBJECT_MAP: Record<string, SubjectTheme> = {
  // Sciences
  science: {
    icon: FlaskConical,
    color: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-50',
    emoji: '🧪',
  },
  physics: { icon: Atom, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50', emoji: '⚛️' },
  chemistry: {
    icon: Beaker,
    color: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-50',
    emoji: '🔬',
  },
  biology: {
    icon: TreePine,
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    emoji: '🌿',
  },
  lab: {
    icon: Microscope,
    color: 'from-violet-400 to-purple-500',
    bgColor: 'bg-violet-50',
    emoji: '🔬',
  },

  // Maths
  maths: {
    icon: Calculator,
    color: 'from-orange-400 to-amber-500',
    bgColor: 'bg-orange-50',
    emoji: '📐',
  },
  mathematics: {
    icon: Calculator,
    color: 'from-orange-400 to-amber-500',
    bgColor: 'bg-orange-50',
    emoji: '📐',
  },
  math: {
    icon: Calculator,
    color: 'from-orange-400 to-amber-500',
    bgColor: 'bg-orange-50',
    emoji: '📐',
  },

  // Social Studies
  'social studies': {
    icon: Globe2,
    color: 'from-sky-400 to-blue-500',
    bgColor: 'bg-sky-50',
    emoji: '🌍',
  },
  social: { icon: Globe2, color: 'from-sky-400 to-blue-500', bgColor: 'bg-sky-50', emoji: '🌍' },
  history: {
    icon: Landmark,
    color: 'from-amber-500 to-yellow-600',
    bgColor: 'bg-amber-50',
    emoji: '🏛️',
  },
  geography: {
    icon: Globe2,
    color: 'from-teal-400 to-cyan-500',
    bgColor: 'bg-teal-50',
    emoji: '🗺️',
  },
  civics: {
    icon: Scale,
    color: 'from-indigo-400 to-blue-500',
    bgColor: 'bg-indigo-50',
    emoji: '⚖️',
  },
  economics: {
    icon: Scale,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    emoji: '📊',
  },

  // Languages
  english: {
    icon: BookOpen,
    color: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-50',
    emoji: '📖',
  },
  hindi: {
    icon: Languages,
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50',
    emoji: '🕉️',
  },
  telugu: {
    icon: Languages,
    color: 'from-yellow-400 to-amber-500',
    bgColor: 'bg-yellow-50',
    emoji: '📜',
  },
  kannada: {
    icon: Languages,
    color: 'from-red-400 to-rose-500',
    bgColor: 'bg-red-50',
    emoji: '📝',
  },
  tamil: {
    icon: Languages,
    color: 'from-pink-400 to-fuchsia-500',
    bgColor: 'bg-pink-50',
    emoji: '📕',
  },
  sanskrit: {
    icon: Languages,
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50',
    emoji: '🪷',
  },
  urdu: { icon: Pen, color: 'from-emerald-400 to-teal-500', bgColor: 'bg-emerald-50', emoji: '✒️' },
  french: {
    icon: Languages,
    color: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-blue-50',
    emoji: '🇫🇷',
  },

  // Technology
  computer: {
    icon: Monitor,
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    emoji: '💻',
  },
  computers: {
    icon: Monitor,
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    emoji: '💻',
  },
  'computer science': {
    icon: Code,
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-50',
    emoji: '💻',
  },
  it: { icon: Code, color: 'from-slate-400 to-gray-600', bgColor: 'bg-slate-50', emoji: '🖥️' },

  // Arts & Sports
  art: { icon: Palette, color: 'from-pink-400 to-rose-500', bgColor: 'bg-pink-50', emoji: '🎨' },
  drawing: {
    icon: Palette,
    color: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-50',
    emoji: '🎨',
  },
  music: {
    icon: Music,
    color: 'from-violet-400 to-purple-500',
    bgColor: 'bg-violet-50',
    emoji: '🎵',
  },
  pe: { icon: Dumbbell, color: 'from-red-400 to-orange-500', bgColor: 'bg-red-50', emoji: '🏃' },
  'physical education': {
    icon: Dumbbell,
    color: 'from-red-400 to-orange-500',
    bgColor: 'bg-red-50',
    emoji: '🏃',
  },
  sports: {
    icon: Dumbbell,
    color: 'from-red-400 to-orange-500',
    bgColor: 'bg-red-50',
    emoji: '⚽',
  },
};

// Default fallback
const DEFAULT_THEME: SubjectTheme = {
  icon: BookOpen,
  color: 'from-gray-400 to-slate-500',
  bgColor: 'bg-gray-50',
  emoji: '📚',
};

/**
 * Get the theme (icon, color, emoji) for a subject by name.
 * Performs case-insensitive partial matching.
 */
export function getSubjectTheme(subjectName: string | null | undefined): SubjectTheme {
  if (!subjectName) {
    return DEFAULT_THEME;
  }

  const lower = subjectName.toLowerCase().trim();

  // Exact match first
  if (SUBJECT_MAP[lower]) {
    return SUBJECT_MAP[lower];
  }

  // Partial match (e.g., "Science Lab" matches "science")
  for (const [key, theme] of Object.entries(SUBJECT_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return theme;
    }
  }

  return DEFAULT_THEME;
}
