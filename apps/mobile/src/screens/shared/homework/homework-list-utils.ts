/**
 * Homework list — shared helpers and types
 */

import { HOMEWORK_STATUS, getSubjectColor } from '@educard/shared';
import type { Homework, HomeworkStatus } from '@educard/shared';

export interface SubjectHomework {
  subject: {
    public_id: string;
    subject_name: string;
    is_teacher?: boolean;
    teacher_name?: string;
  };
  homework: Homework | null;
  color: ReturnType<typeof getSubjectColor>;
}

export function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getStatusBgColor(status: HomeworkStatus): string {
  switch (status) {
    case HOMEWORK_STATUS.PUBLISHED:
      return '#dcfce7';
    case HOMEWORK_STATUS.DRAFT:
      return '#fef3c7';
    case HOMEWORK_STATUS.ARCHIVED:
      return '#f3f4f6';
    default:
      return '#f3f4f6';
  }
}

export function getStatusTextColor(status: HomeworkStatus): string {
  switch (status) {
    case HOMEWORK_STATUS.PUBLISHED:
      return '#166534';
    case HOMEWORK_STATUS.DRAFT:
      return '#92400e';
    case HOMEWORK_STATUS.ARCHIVED:
      return '#374151';
    default:
      return '#374151';
  }
}
