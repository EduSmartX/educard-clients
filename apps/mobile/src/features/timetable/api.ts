/**
 * Timetable API — Admin and Employee endpoints
 */

import { apiClient } from '@/api/client';

import type {
  ClassGroup,
  TimetableSlot,
  ClassTimetableResponse,
  MyTimetableResponse,
  ClassGroupCreatePayload,
  BulkSlotPayload,
  TimetableEntryCreatePayload,
  TimetableEntry,
} from './types';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  warnings?: string[] | null;
}

const ADMIN_BASE = '/timetable/admin';
const EMPLOYEE_BASE = '/timetable/employee';

// Queries

export async function fetchClassGroups(): Promise<ClassGroup[]> {
  const res = await apiClient.get<ApiResponse<ClassGroup[]>>(`${ADMIN_BASE}/class-groups/`);
  return res.data.data;
}

export async function fetchSlots(groupId: string, day?: number): Promise<TimetableSlot[]> {
  const params = day !== undefined ? { day } : {};
  const res = await apiClient.get<ApiResponse<TimetableSlot[]>>(
    `${ADMIN_BASE}/class-groups/${groupId}/slots/`,
    { params }
  );
  return res.data.data;
}

export async function fetchClassTimetable(classId: string): Promise<ClassTimetableResponse> {
  const res = await apiClient.get<ApiResponse<ClassTimetableResponse>>(
    `${ADMIN_BASE}/class/${classId}/timetable/`
  );
  return res.data.data;
}

export async function fetchMyTimetable(): Promise<MyTimetableResponse> {
  const res = await apiClient.get<ApiResponse<MyTimetableResponse>>(
    `${EMPLOYEE_BASE}/my-timetable/`
  );
  return res.data.data;
}

// Mutations

export async function createClassGroup(data: ClassGroupCreatePayload): Promise<ClassGroup> {
  const res = await apiClient.post<ApiResponse<ClassGroup>>(`${ADMIN_BASE}/class-groups/`, data);
  return res.data.data;
}

export async function updateClassGroup(
  publicId: string,
  data: ClassGroupCreatePayload
): Promise<ClassGroup> {
  const res = await apiClient.put<ApiResponse<ClassGroup>>(
    `${ADMIN_BASE}/class-groups/${publicId}/`,
    data
  );
  return res.data.data;
}

export async function deleteClassGroup(publicId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/class-groups/${publicId}/`);
}

export async function addClassToGroup(groupPublicId: string, classPublicId: string): Promise<void> {
  await apiClient.post(`${ADMIN_BASE}/class-groups/${groupPublicId}/classes/`, {
    class_public_id: classPublicId,
  });
}

export async function removeClassFromGroup(
  groupPublicId: string,
  classPublicId: string
): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/class-groups/${groupPublicId}/classes/${classPublicId}/`);
}

export async function bulkSaveSlots(
  groupPublicId: string,
  data: BulkSlotPayload
): Promise<TimetableSlot[]> {
  const res = await apiClient.post<ApiResponse<TimetableSlot[]>>(
    `${ADMIN_BASE}/class-groups/${groupPublicId}/slots/`,
    data
  );
  return res.data.data;
}

export async function clearDaySlots(groupPublicId: string, day: number): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/class-groups/${groupPublicId}/slots/day/${day}/`);
}

export async function createEntry(
  data: TimetableEntryCreatePayload
): Promise<{ entry: TimetableEntry; warnings?: string[] | null }> {
  const res = await apiClient.post<ApiResponse<TimetableEntry>>(`${ADMIN_BASE}/entries/`, data);
  return { entry: res.data.data, warnings: res.data.warnings };
}

export async function deleteEntry(publicId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE}/entries/${publicId}/`);
}
