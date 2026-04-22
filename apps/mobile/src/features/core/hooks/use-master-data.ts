/**
 * Core Feature — Hooks
 * Hooks for fetching master/reference data
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@educard/shared';
import {
  getCoreClasses,
  getCoreSubjects,
  getRoleTypes,
  getDepartments,
  getSupervisors,
  getLeaveTypes,
} from '../api/master-api';

/** Long staleTime for reference data that rarely changes */
const MASTER_STALE = 30 * 60 * 1000; // 30 min
const MASTER_GC = 60 * 60 * 1000; // 60 min

export function useCoreClasses() {
  return useQuery({
    queryKey: QueryKeys.CORE.CLASSES,
    queryFn: getCoreClasses,
    staleTime: MASTER_STALE,
    gcTime: MASTER_GC,
  });
}

export function useCoreSubjects() {
  return useQuery({
    queryKey: QueryKeys.CORE.SUBJECTS,
    queryFn: getCoreSubjects,
    staleTime: MASTER_STALE,
    gcTime: MASTER_GC,
  });
}

export function useRoleTypes() {
  return useQuery({
    queryKey: QueryKeys.CORE.ROLE_TYPES,
    queryFn: getRoleTypes,
    staleTime: MASTER_STALE,
    gcTime: MASTER_GC,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: QueryKeys.CORE.DEPARTMENTS,
    queryFn: getDepartments,
    staleTime: MASTER_STALE,
    gcTime: MASTER_GC,
  });
}

export function useSupervisors() {
  return useQuery({
    queryKey: QueryKeys.CORE.SUPERVISORS,
    queryFn: getSupervisors,
    staleTime: 5 * 60 * 1000, // 5 min — people change more often
    gcTime: 15 * 60 * 1000,
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: QueryKeys.CORE.LEAVE_TYPES,
    queryFn: getLeaveTypes,
    staleTime: MASTER_STALE,
    gcTime: MASTER_GC,
  });
}
