/**
 * Classes Feature — Barrel Exports (data layer + list component)
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
  useManagedClasses,
  useClassDetail,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useRestoreClass,
} from './hooks/use-classes';

export { ClassList } from './components';
export type { ClassListProps } from './components';
