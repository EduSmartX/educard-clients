export interface SubjectColorScheme {
  bg: string;
  border: string;
  text: string;
  hex: string;
  light: string;
}

export const SUBJECT_COLOR_PALETTE: readonly SubjectColorScheme[] = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', hex: '#3b82f6', light: '#dbeafe' },
  { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-800', hex: '#10b981', light: '#d1fae5' },
  { bg: 'bg-violet-100', border: 'border-violet-400', text: 'text-violet-800', hex: '#8b5cf6', light: '#ede9fe' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', hex: '#f59e0b', light: '#fef3c7' },
  { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-800', hex: '#f43f5e', light: '#ffe4e6' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-800', hex: '#06b6d4', light: '#cffafe' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', hex: '#ec4899', light: '#fce7f3' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', hex: '#14b8a6', light: '#ccfbf1' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', hex: '#f97316', light: '#ffedd5' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800', hex: '#6366f1', light: '#e0e7ff' },
  { bg: 'bg-lime-100', border: 'border-lime-400', text: 'text-lime-800', hex: '#84cc16', light: '#ecfccb' },
  { bg: 'bg-fuchsia-100', border: 'border-fuchsia-400', text: 'text-fuchsia-800', hex: '#d946ef', light: '#fae8ff' },
  { bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-800', hex: '#0ea5e9', light: '#e0f2fe' },
  { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', hex: '#ef4444', light: '#fee2e2' },
  { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-800', hex: '#64748b', light: '#e2e8f0' },
] as const;

export const UNASSIGNED_SUBJECT_COLOR: SubjectColorScheme = {
  bg: 'bg-slate-50',
  border: 'border-slate-300',
  text: 'text-slate-400',
  hex: '#94a3b8',
  light: '#f1f5f9',
};

const MASTER_SUBJECT_COLOR_INDEX: Record<string, number> = {
  mathematics: 0,
  science: 1,
  english: 2,
  hindi: 3,
  'social studies': 4,
  physics: 5,
  chemistry: 6,
  biology: 7,
  history: 8,
  geography: 9,
  'computer science': 10,
  'physical education': 11,
  arts: 12,
  music: 13,
  economics: 14,
  accountancy: 0,
  'business studies': 1,
  'political science': 2,
};

export function getSubjectColor(subjectName: string | null | undefined): SubjectColorScheme {
  if (!subjectName) return UNASSIGNED_SUBJECT_COLOR;

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

export function getSubjectHexColor(subjectName: string | null | undefined): string {
  return getSubjectColor(subjectName).hex;
}
