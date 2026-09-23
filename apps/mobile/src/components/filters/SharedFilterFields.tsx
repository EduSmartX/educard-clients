/**
 * Shared / Reusable Filter Fields & Label Helpers
 * Common filter definitions used across multiple list screens
 */

import { FilterField } from './FilterModal';

// ── Reusable filter fields ───────────────────────────────────────

/** Gender select – use as-is or override `name` for different backends */
export const GENDER_FILTER_FIELD: FilterField = {
  name: 'gender',
  label: 'Gender',
  type: 'select',
  icon: '👤',
  options: [
    { value: '', label: 'All Genders' },
    { value: 'M', label: '👨 Male' },
    { value: 'F', label: '👩 Female' },
    { value: 'O', label: 'Other' },
  ],
};

/** Deleted toggle – pass entity name for context */
export const makeDeletedToggle = (entity: string): FilterField => ({
  name: 'is_deleted',
  label: `🗑️  Show deleted ${entity}`,
  type: 'toggle',
});

// ── Reusable label helpers ───────────────────────────────────────

const GENDER_LABELS: Record<string, string> = { M: 'Male', F: 'Female', O: 'Other' };

export type FilterLabel = { key: string; label: string; value: unknown };

/** Resolve gender label from a filter value. `key` is the backend param name. */
export function getGenderLabel(
  filters: Record<string, unknown>,
  key = 'gender'
): FilterLabel | null {
  const val = filters[key] as string | undefined;
  if (!val) return null;
  const label = GENDER_LABELS[val];
  return { key, label: label ?? val, value: val };
}

/** Resolve is_deleted label */
export function getDeletedLabel(filters: Record<string, unknown>): FilterLabel | null {
  if (!filters.is_deleted) return null;
  return { key: 'is_deleted', label: 'Deleted', value: true };
}
