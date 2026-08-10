/**
 * Renders an applied filter as "Field: Option" using the field definitions,
 * so raw values (public IDs, gender codes) never surface in the UI.
 */

import type { FilterField } from '@/components/filters/resource-filter';

function titleCase(key: string): string {
  return key
    .replaceAll('__', ' ')
    .replaceAll('_', ' ')
    .replace(/\bpublic id\b/gi, '')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function findField(fields: FilterField[], key: string): FilterField | undefined {
  return fields.find(
    (field) => field.name === key || field.startDateName === key || field.endDateName === key
  );
}

/** Resolves a stored filter value to the label shown in its dropdown. */
export function resolveFilterValueLabel(fields: FilterField[], key: string, value: string): string {
  const field = findField(fields, key);
  if (!field?.options) {
    // Date fields have no options; show them in the user's locale.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`).toLocaleDateString();
    }
    return value;
  }
  // Multiselect values arrive comma-joined.
  return value
    .split(',')
    .map((part) => field.options?.find((opt) => opt.value === part)?.label ?? part)
    .join(', ');
}

export function resolveFilterKeyLabel(fields: FilterField[], key: string): string {
  const field = findField(fields, key);
  if (!field) {
    return titleCase(key);
  }
  if (field.startDateName === key) {
    return 'From Date';
  }
  if (field.endDateName === key) {
    return 'To Date';
  }
  return field.label;
}

export function describeFilter(fields: FilterField[], key: string, value: string): string {
  return `${resolveFilterKeyLabel(fields, key)}: ${resolveFilterValueLabel(fields, key, value)}`;
}
