/**
 * Subjects Feature — Barrel Exports
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
