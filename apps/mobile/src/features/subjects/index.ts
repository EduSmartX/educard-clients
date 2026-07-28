/**
 * Subjects Feature — Barrel Exports (data layer + list component)
 */

export {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  restoreSubject,
  getSubjectsByClass,
  type SubjectQueryParams,
  type SubjectListResponse,
} from './api/subjects-api';

export {
  subjectKeys,
  useSubjects,
  useSubjectsByClass,
  useSubjectDetail,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useRestoreSubject,
} from './hooks/use-subjects';

export { SubjectList } from './components';
export type { SubjectListProps } from './components';
