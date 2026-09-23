/**
 * Shared row styling for subject-coloured lists (timetable, exams, marks).
 */

import type { SubjectColorScheme } from '@educard/shared';

/** Lift-on-hover card behaviour applied to every subject row. */
const FLOATING =
  'rounded-xl border border-l-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md';

export function subjectRowClasses(color: SubjectColorScheme, isMuted = false): string {
  if (isMuted) {
    return `${FLOATING} border-slate-200 border-l-slate-300 bg-slate-50 opacity-70`;
  }
  return `${FLOATING} ${color.bg} ${color.border}`;
}

/** Non-teaching slots (breaks, assembly) read as green rather than a subject tint. */
export function breakRowClasses(): string {
  return `${FLOATING} border-emerald-200 border-l-emerald-400 bg-emerald-50`;
}
