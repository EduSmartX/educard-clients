/**
 * Classes Feature — Barrel Exports
 */

export {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  restoreClass,
  type ClassQueryParams,
  type ClassListResponse,
} from './api/classes-api';

export {
  classKeys,
  useClasses,
  useClassDetail,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useRestoreClass,
} from './hooks/use-classes';
