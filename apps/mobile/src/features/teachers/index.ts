/**
 * Teachers Feature — Barrel Exports (data layer + list component)
 */

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

export {
  teacherKeys,
  useTeachers,
  useTeacherDetail,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useRestoreTeacher,
} from './hooks/use-teachers';

export { TeacherList } from './components';
export type { TeacherListProps } from './components';
