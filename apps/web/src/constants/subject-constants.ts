/**
 * Subject Constants
 * Options and helpers for subject type management
 */

export const SUBJECT_TYPE = {
  CORE: "core",
  ELECTIVE: "elective",
  LANGUAGE: "language",
} as const;

export type SubjectTypeValue = (typeof SUBJECT_TYPE)[keyof typeof SUBJECT_TYPE];

export const SUBJECT_TYPE_OPTIONS = [
  { value: "core", label: "Core" },
  { value: "elective", label: "Elective" },
  { value: "language", label: "Language" },
] as const;

export function getSubjectTypeLabel(value: string): string {
  const option = SUBJECT_TYPE_OPTIONS.find((opt) => opt.value === value);
  return option?.label || value || "—";
}
