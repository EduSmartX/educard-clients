/**
 * Core Feature — Barrel Exports
 */

export {
  getCoreClasses,
  getCoreSubjects,
  getRoleTypes,
  getDepartments,
  getSupervisors,
  getLeaveTypes,
  uploadProfilePhoto,
} from './api/master-api';

// Re-export shared master types
export type {
  CoreClass,
  CoreSubject,
  RoleType,
  Department,
  Supervisor,
  LeaveType,
  MasterListResponse,
} from '@educard/shared';

export {
  useCoreClasses,
  useCoreSubjects,
  useRoleTypes,
  useDepartments,
  useSupervisors,
  useLeaveTypes,
} from './hooks/use-master-data';
