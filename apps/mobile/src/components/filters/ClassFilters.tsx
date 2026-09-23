/**
 * Class Filter Configuration
 * Filter fields specific to classes list
 */

import { FilterField } from './FilterModal';
import { makeDeletedToggle, getDeletedLabel, type FilterLabel } from './SharedFilterFields';

export const CLASS_FILTER_FIELDS: FilterField[] = [makeDeletedToggle('classes')];

export function getClassFilterLabels(filters: Record<string, unknown>): FilterLabel[] {
  const result: FilterLabel[] = [];

  const deleted = getDeletedLabel(filters);
  if (deleted) result.push(deleted);

  return result;
}
