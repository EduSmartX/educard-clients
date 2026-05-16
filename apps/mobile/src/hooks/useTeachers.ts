/**
 * Teachers Hooks — Re-export shim
 * @deprecated Import from '@/features/teachers' instead
 */
export {
  teacherKeys,
  useTeachers,
  useTeacherDetail,
  useCreateTeacher,
  useDeleteTeacher,
  useRestoreTeacher,
} from '@/features/teachers';

// Re-export query param type for backward compat
export type { TeacherQueryParams } from '@/features/teachers';
