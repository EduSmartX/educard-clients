/**
 * Global Subject Color Palette
 *
 * Each subject gets a unique, visually distinct color scheme.
 * Colors are used consistently across all modules: timetable, homework, exams, marks, reports.
 *
 * Usage:
 *   import { getSubjectColor, SUBJECT_COLOR_PALETTE } from '@/constants/subject-colors';
 *
 *   const color = getSubjectColor('Mathematics');
 *   <div className={`${color.bg} ${color.border} ${color.text}`}>…</div>
 */

export interface SubjectColorScheme {
  bg: string;
  border: string;
  text: string;
  badge: string;
  accent: string;
  light: string;
  hex: string;
}

export const SUBJECT_COLOR_PALETTE: readonly SubjectColorScheme[] = [
  {
    bg: 'bg-blue-100',
    border: 'border-blue-400',
    text: 'text-blue-800',
    badge: 'bg-blue-200 text-blue-800',
    accent: 'bg-blue-500',
    light: 'bg-blue-200',
    hex: '#3b82f6',
  },
  {
    bg: 'bg-emerald-100',
    border: 'border-emerald-400',
    text: 'text-emerald-800',
    badge: 'bg-emerald-200 text-emerald-800',
    accent: 'bg-emerald-500',
    light: 'bg-emerald-200',
    hex: '#10b981',
  },
  {
    bg: 'bg-violet-100',
    border: 'border-violet-400',
    text: 'text-violet-800',
    badge: 'bg-violet-200 text-violet-800',
    accent: 'bg-violet-500',
    light: 'bg-violet-200',
    hex: '#8b5cf6',
  },
  {
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    text: 'text-amber-800',
    badge: 'bg-amber-200 text-amber-800',
    accent: 'bg-amber-500',
    light: 'bg-amber-200',
    hex: '#f59e0b',
  },
  {
    bg: 'bg-rose-100',
    border: 'border-rose-400',
    text: 'text-rose-800',
    badge: 'bg-rose-200 text-rose-800',
    accent: 'bg-rose-500',
    light: 'bg-rose-200',
    hex: '#f43f5e',
  },
  {
    bg: 'bg-cyan-100',
    border: 'border-cyan-400',
    text: 'text-cyan-800',
    badge: 'bg-cyan-200 text-cyan-800',
    accent: 'bg-cyan-500',
    light: 'bg-cyan-200',
    hex: '#06b6d4',
  },
  {
    bg: 'bg-pink-100',
    border: 'border-pink-400',
    text: 'text-pink-800',
    badge: 'bg-pink-200 text-pink-800',
    accent: 'bg-pink-500',
    light: 'bg-pink-200',
    hex: '#ec4899',
  },
  {
    bg: 'bg-teal-100',
    border: 'border-teal-400',
    text: 'text-teal-800',
    badge: 'bg-teal-200 text-teal-800',
    accent: 'bg-teal-500',
    light: 'bg-teal-200',
    hex: '#14b8a6',
  },
  {
    bg: 'bg-orange-100',
    border: 'border-orange-400',
    text: 'text-orange-800',
    badge: 'bg-orange-200 text-orange-800',
    accent: 'bg-orange-500',
    light: 'bg-orange-200',
    hex: '#f97316',
  },
  {
    bg: 'bg-indigo-100',
    border: 'border-indigo-400',
    text: 'text-indigo-800',
    badge: 'bg-indigo-200 text-indigo-800',
    accent: 'bg-indigo-500',
    light: 'bg-indigo-200',
    hex: '#6366f1',
  },
  {
    bg: 'bg-lime-100',
    border: 'border-lime-400',
    text: 'text-lime-800',
    badge: 'bg-lime-200 text-lime-800',
    accent: 'bg-lime-500',
    light: 'bg-lime-200',
    hex: '#84cc16',
  },
  {
    bg: 'bg-fuchsia-100',
    border: 'border-fuchsia-400',
    text: 'text-fuchsia-800',
    badge: 'bg-fuchsia-200 text-fuchsia-800',
    accent: 'bg-fuchsia-500',
    light: 'bg-fuchsia-200',
    hex: '#d946ef',
  },
  {
    bg: 'bg-sky-100',
    border: 'border-sky-400',
    text: 'text-sky-800',
    badge: 'bg-sky-200 text-sky-800',
    accent: 'bg-sky-500',
    light: 'bg-sky-200',
    hex: '#0ea5e9',
  },
  {
    bg: 'bg-red-100',
    border: 'border-red-400',
    text: 'text-red-800',
    badge: 'bg-red-200 text-red-800',
    accent: 'bg-red-500',
    light: 'bg-red-200',
    hex: '#ef4444',
  },
  {
    bg: 'bg-slate-200',
    border: 'border-slate-400',
    text: 'text-slate-800',
    badge: 'bg-slate-300 text-slate-800',
    accent: 'bg-slate-500',
    light: 'bg-slate-300',
    hex: '#64748b',
  },
] as const;

export const UNASSIGNED_SUBJECT_COLOR: SubjectColorScheme = {
  bg: 'bg-slate-50',
  border: 'border-dashed border-slate-300',
  text: 'text-slate-400',
  badge: 'bg-slate-100 text-slate-500',
  accent: 'bg-slate-300',
  light: 'bg-slate-100',
  hex: '#94a3b8',
};

/**
 * Master Subject Color Index
 * Maps MstSubject names (from populate_master_data.py) to palette indices.
 * Unknown subjects fall back to deterministic hash-based color assignment.
 *
 * Source: edusphere/core/management/commands/populate_master_data.py
 */
const MASTER_SUBJECT_COLOR_INDEX: Record<string, number> = {
  // From MstSubject table (18 subjects)
  mathematics: 0, // MATH - Blue
  science: 1, // SCI - Emerald
  english: 2, // ENG - Violet
  hindi: 3, // HIN - Amber
  'social studies': 4, // SST - Rose
  physics: 5, // PHY - Cyan
  chemistry: 6, // CHEM - Pink
  biology: 7, // BIO - Teal
  history: 8, // HIST - Orange
  geography: 9, // GEO - Indigo
  'computer science': 10, // CS - Lime
  'physical education': 11, // PE - Fuchsia
  arts: 12, // ART - Sky
  music: 13, // MUS - Red
  economics: 14, // ECO - Slate
  accountancy: 0, // ACC - Blue (cycle)
  'business studies': 1, // BS - Emerald (cycle)
  'political science': 2, // POL_SCI - Violet (cycle)
};

/**
 * Get a color for a subject by name.
 * Known master subjects get their predefined hardcoded color.
 * Unknown subjects get a deterministic color based on name hash (same name = same color always).
 */
export function getSubjectColor(subjectName: string | null | undefined): SubjectColorScheme {
  if (!subjectName) {
    return UNASSIGNED_SUBJECT_COLOR;
  }

  const key = subjectName.trim().toLowerCase();
  const knownIdx = MASTER_SUBJECT_COLOR_INDEX[key];

  if (knownIdx !== undefined) {
    return SUBJECT_COLOR_PALETTE[knownIdx];
  }

  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = (hash >>> 0) % SUBJECT_COLOR_PALETTE.length;
  return SUBJECT_COLOR_PALETTE[idx];
}

/**
 * Build a color map for a list of subject names.
 * Ensures no two subjects in the same view share a color (up to 15 subjects).
 */
export function buildSubjectColorMap(
  subjectNames: (string | null | undefined)[]
): Map<string, SubjectColorScheme> {
  const map = new Map<string, SubjectColorScheme>();
  const usedIndices = new Set<number>();
  const unknownSubjects: string[] = [];

  for (const name of subjectNames) {
    if (!name || map.has(name)) {
      continue;
    }

    const key = name.trim().toLowerCase();
    const knownIdx = MASTER_SUBJECT_COLOR_INDEX[key];

    if (knownIdx !== undefined) {
      map.set(name, SUBJECT_COLOR_PALETTE[knownIdx]);
      usedIndices.add(knownIdx);
    } else {
      unknownSubjects.push(name);
    }
  }

  let nextFree = 0;
  for (const name of unknownSubjects) {
    if (map.has(name)) {
      continue;
    }

    while (usedIndices.has(nextFree) && nextFree < SUBJECT_COLOR_PALETTE.length) {
      nextFree++;
    }

    const idx = nextFree % SUBJECT_COLOR_PALETTE.length;
    map.set(name, SUBJECT_COLOR_PALETTE[idx]);
    usedIndices.add(idx);
    nextFree++;
  }

  return map;
}
