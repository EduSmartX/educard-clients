/**
 * Students Feature — Barrel Exports
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

// Components
export { StudentList, type StudentListProps } from './components';
