/**
 * Fee Structure Filter Configuration
 * Reusable filter fields + active label helpers for fee structure listing.
 */

import type { FilterField } from './FilterModal';
import type { FilterLabel } from './SharedFilterFields';

export interface FeeClassOption {
  value: string;
  label: string;
}

export function buildFeeStructureFilterFields(classOptions: FeeClassOption[]): FilterField[] {
  return [
    {
      name: 'class_public_id',
      label: 'Class',
      type: 'select',
      icon: '🏫',
      options: [{ value: '', label: 'All Classes' }, ...classOptions],
    },
    {
      name: 'is_active',
      label: 'Status',
      type: 'select',
      icon: '📊',
      options: [
        { value: '', label: 'All Status' },
        { value: 'true', label: '🟢 Active' },
        { value: 'false', label: '⚪ Inactive' },
      ],
    },
  ];
}

export function getFeeStructureFilterLabels(
  filters: Record<string, unknown>,
  classOptions: FeeClassOption[]
): FilterLabel[] {
  const labels: FilterLabel[] = [];

  const classId = filters.class_public_id as string | undefined;
  if (classId) {
    const cls = classOptions.find((c) => c.value === classId);
    labels.push({
      key: 'class_public_id',
      label: cls ? `Class: ${cls.label}` : 'Class filter',
      value: classId,
    });
  }

  const isActive = filters.is_active as string | undefined;
  if (isActive === 'true') {
    labels.push({ key: 'is_active', label: 'Status: Active', value: true });
  } else if (isActive === 'false') {
    labels.push({ key: 'is_active', label: 'Status: Inactive', value: false });
  }

  return labels;
}
