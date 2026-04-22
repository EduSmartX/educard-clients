/**
 * Teachers Feature — Barrel Exports
 */

// API
export {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  restoreTeacher,
  type TeacherQueryParams,
  type TeacherListResponse,
} from './api/teachers-api';

// Hooks
export {
  teacherKeys,
  useTeachers,
  useTeacherDetail,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useRestoreTeacher,
} from './hooks/use-teachers';
