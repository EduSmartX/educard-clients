/**
 * Global Subject Color Palette
 *
 * Re-exports from @educard/shared to maintain single source of truth.
 * All color data, getSubjectColor, and buildSubjectColorMap live in the shared package.
 *
 * Usage:
 *   import { getSubjectColor, SUBJECT_COLOR_PALETTE } from '@/constants/subject-colors';
 *
 *   const color = getSubjectColor('Mathematics');
 *   <div className={`${color.bg} ${color.border} ${color.text}`}>…</div>
 */

export {
  SUBJECT_COLOR_PALETTE,
  UNASSIGNED_SUBJECT_COLOR,
  getSubjectColor,
  getSubjectHexColor,
  buildSubjectColorMap,
} from '@educard/shared';

export type { SubjectColorScheme } from '@educard/shared';
