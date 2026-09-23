/**
 * Students Feature — Barrel Exports (data layer + list component)
 */

export {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  type StudentQueryParams,
  type StudentListResponse,
} from './api/students-api';

export {
  studentKeys,
  useStudents,
  useStudentDetail,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useRestoreStudent,
} from './hooks/use-students';

export { StudentList, ExportStudentsModal } from './components';
export type { StudentListProps } from './components';
