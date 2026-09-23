export interface SubjectColorScheme {
  bg: string;
  border: string;
  text: string;
  hex: string;
  light: string;
  /** Tailwind badge classes (web-only usage) */
  badge?: string;
  /** Tailwind accent class (web-only usage) */
  accent?: string;
}

export const SUBJECT_COLOR_PALETTE: readonly SubjectColorScheme[] = [
  {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    hex: "#3b82f6",
    light: "#dbeafe",
    badge: "bg-blue-200 text-blue-800",
    accent: "bg-blue-500",
  },
  {
    bg: "bg-emerald-100",
    border: "border-emerald-400",
    text: "text-emerald-800",
    hex: "#10b981",
    light: "#d1fae5",
    badge: "bg-emerald-200 text-emerald-800",
    accent: "bg-emerald-500",
  },
  {
    bg: "bg-violet-100",
    border: "border-violet-400",
    text: "text-violet-800",
    hex: "#8b5cf6",
    light: "#ede9fe",
    badge: "bg-violet-200 text-violet-800",
    accent: "bg-violet-500",
  },
  {
    bg: "bg-amber-100",
    border: "border-amber-400",
    text: "text-amber-800",
    hex: "#f59e0b",
    light: "#fef3c7",
    badge: "bg-amber-200 text-amber-800",
    accent: "bg-amber-500",
  },
  {
    bg: "bg-rose-100",
    border: "border-rose-400",
    text: "text-rose-800",
    hex: "#f43f5e",
    light: "#ffe4e6",
    badge: "bg-rose-200 text-rose-800",
    accent: "bg-rose-500",
  },
  {
    bg: "bg-cyan-100",
    border: "border-cyan-400",
    text: "text-cyan-800",
    hex: "#06b6d4",
    light: "#cffafe",
    badge: "bg-cyan-200 text-cyan-800",
    accent: "bg-cyan-500",
  },
  {
    bg: "bg-pink-100",
    border: "border-pink-400",
    text: "text-pink-800",
    hex: "#ec4899",
    light: "#fce7f3",
    badge: "bg-pink-200 text-pink-800",
    accent: "bg-pink-500",
  },
  {
    bg: "bg-teal-100",
    border: "border-teal-400",
    text: "text-teal-800",
    hex: "#14b8a6",
    light: "#ccfbf1",
    badge: "bg-teal-200 text-teal-800",
    accent: "bg-teal-500",
  },
  {
    bg: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-800",
    hex: "#f97316",
    light: "#ffedd5",
    badge: "bg-orange-200 text-orange-800",
    accent: "bg-orange-500",
  },
  {
    bg: "bg-indigo-100",
    border: "border-indigo-400",
    text: "text-indigo-800",
    hex: "#6366f1",
    light: "#e0e7ff",
    badge: "bg-indigo-200 text-indigo-800",
    accent: "bg-indigo-500",
  },
  {
    bg: "bg-lime-100",
    border: "border-lime-400",
    text: "text-lime-800",
    hex: "#84cc16",
    light: "#ecfccb",
    badge: "bg-lime-200 text-lime-800",
    accent: "bg-lime-500",
  },
  {
    bg: "bg-fuchsia-100",
    border: "border-fuchsia-400",
    text: "text-fuchsia-800",
    hex: "#d946ef",
    light: "#fae8ff",
    badge: "bg-fuchsia-200 text-fuchsia-800",
    accent: "bg-fuchsia-500",
  },
  {
    bg: "bg-sky-100",
    border: "border-sky-400",
    text: "text-sky-800",
    hex: "#0ea5e9",
    light: "#e0f2fe",
    badge: "bg-sky-200 text-sky-800",
    accent: "bg-sky-500",
  },
  {
    bg: "bg-red-100",
    border: "border-red-400",
    text: "text-red-800",
    hex: "#ef4444",
    light: "#fee2e2",
    badge: "bg-red-200 text-red-800",
    accent: "bg-red-500",
  },
  {
    bg: "bg-slate-200",
    border: "border-slate-400",
    text: "text-slate-800",
    hex: "#64748b",
    light: "#e2e8f0",
    badge: "bg-slate-200 text-slate-800",
    accent: "bg-slate-500",
  },
] as const;

export const UNASSIGNED_SUBJECT_COLOR: SubjectColorScheme = {
  bg: "bg-slate-50",
  border: "border-dashed border-slate-300",
  text: "text-slate-400",
  hex: "#94a3b8",
  light: "#f1f5f9",
  badge: "bg-slate-100 text-slate-500",
  accent: "bg-slate-300",
};

const MASTER_SUBJECT_COLOR_INDEX: Record<string, number> = {
  mathematics: 0,
  science: 1,
  english: 2,
  hindi: 3,
  "social studies": 4,
  physics: 5,
  chemistry: 6,
  biology: 7,
  history: 8,
  geography: 9,
  "computer science": 10,
  "physical education": 11,
  arts: 12,
  music: 13,
  economics: 14,
  accountancy: 0,
  "business studies": 1,
  "political science": 2,
};

export function getSubjectColor(
  subjectName: string | null | undefined,
): SubjectColorScheme {
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
    hash ^= key.codePointAt(i) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  const idx = (hash >>> 0) % SUBJECT_COLOR_PALETTE.length;
  return SUBJECT_COLOR_PALETTE[idx];
}

export function getSubjectHexColor(
  subjectName: string | null | undefined,
): string {
  return getSubjectColor(subjectName).hex;
}

/**
 * Build a color map for a list of subject names.
 * Ensures no two subjects in the same view share a color (up to 15 subjects).
 */
export function buildSubjectColorMap(
  subjectNames: (string | null | undefined)[],
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

    if (knownIdx === undefined) {
      unknownSubjects.push(name);
    } else {
      map.set(name, SUBJECT_COLOR_PALETTE[knownIdx]);
      usedIndices.add(knownIdx);
    }
  }

  let nextFree = 0;
  for (const name of unknownSubjects) {
    if (map.has(name)) {
      continue;
    }

    while (
      usedIndices.has(nextFree) &&
      nextFree < SUBJECT_COLOR_PALETTE.length
    ) {
      nextFree++;
    }

    const idx = nextFree % SUBJECT_COLOR_PALETTE.length;
    map.set(name, SUBJECT_COLOR_PALETTE[idx]);
    usedIndices.add(idx);
    nextFree++;
  }

  return map;
}
