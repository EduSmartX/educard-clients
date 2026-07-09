/**
 * Timetable API
 * All API calls for timetable operations
 */

import api from '@/lib/api';
import { isAdminUser } from '@/lib/utils/auth-utils';
import type {
  ClassGroup,
  ClassGroupCreatePayload,
  TimetableSlot,
  BulkSlotPayload,
  TimetableEntry,
  TimetableEntryCreatePayload,
  ClassTimetableResponse,
  ClassTimetableDateResponse,
  ClassTimetableWeekResponse,
  MyTimetableResponse,
  TimetableOverride,
  TimetableOverrideUpsertPayload,
} from '../types';

// Base URLs
const ADMIN_BASE = '/timetable/admin';
const EMPLOYEE_BASE = '/timetable/employee';

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  warnings?: string[] | null;
}

export async function fetchClassGroups(): Promise<ClassGroup[]> {
  const response = await api.get<ApiResponse<ClassGroup[]>>(`${ADMIN_BASE}/class-groups/`);
  return response.data.data;
}

export async function fetchClassGroup(publicId: string): Promise<ClassGroup> {
  const response = await api.get<ApiResponse<ClassGroup>>(
    `${ADMIN_BASE}/class-groups/${publicId}/`
  );
  return response.data.data;
}

export async function createClassGroup(data: ClassGroupCreatePayload): Promise<ClassGroup> {
  const response = await api.post<ApiResponse<ClassGroup>>(`${ADMIN_BASE}/class-groups/`, data);
  return response.data.data;
}

export async function updateClassGroup(
  publicId: string,
  data: ClassGroupCreatePayload
): Promise<ClassGroup> {
  const response = await api.put<ApiResponse<ClassGroup>>(
    `${ADMIN_BASE}/class-groups/${publicId}/`,
    data
  );
  return response.data.data;
}

export async function deleteClassGroup(publicId: string): Promise<void> {
  await api.delete(`${ADMIN_BASE}/class-groups/${publicId}/`);
}

export async function addClassToGroup(groupPublicId: string, classPublicId: string): Promise<void> {
  await api.post(`${ADMIN_BASE}/class-groups/${groupPublicId}/classes/`, {
    class_public_id: classPublicId,
  });
}

export async function removeClassFromGroup(
  groupPublicId: string,
  classPublicId: string
): Promise<void> {
  await api.delete(`${ADMIN_BASE}/class-groups/${groupPublicId}/classes/${classPublicId}/`);
}

export async function fetchSlots(groupPublicId: string, day?: number): Promise<TimetableSlot[]> {
  const params = day !== undefined ? { day } : {};
  const response = await api.get<ApiResponse<TimetableSlot[]>>(
    `${ADMIN_BASE}/class-groups/${groupPublicId}/slots/`,
    { params }
  );
  return response.data.data;
}

export async function bulkSaveSlots(
  groupPublicId: string,
  data: BulkSlotPayload
): Promise<TimetableSlot[]> {
  const response = await api.post<ApiResponse<TimetableSlot[]>>(
    `${ADMIN_BASE}/class-groups/${groupPublicId}/slots/`,
    data
  );
  return response.data.data;
}

export async function clearDaySlots(
  groupPublicId: string,
  day: number
): Promise<{ affected_slots: number }> {
  const response = await api.delete<ApiResponse<{ affected_slots: number }>>(
    `${ADMIN_BASE}/class-groups/${groupPublicId}/slots/day/${day}/`
  );
  return response.data.data;
}

export interface CreateEntryResult {
  entry: TimetableEntry;
  warnings?: string[] | null;
}

export async function createEntry(data: TimetableEntryCreatePayload): Promise<CreateEntryResult> {
  const response = await api.post<ApiResponse<TimetableEntry>>(`${ADMIN_BASE}/entries/`, data);
  return {
    entry: response.data.data,
    warnings: response.data.warnings,
  };
}

export async function deleteEntry(publicId: string): Promise<void> {
  await api.delete(`${ADMIN_BASE}/entries/${publicId}/`);
}

export async function fetchClassTimetable(classPublicId: string): Promise<ClassTimetableResponse> {
  const baseUrl = isAdminUser() ? ADMIN_BASE : EMPLOYEE_BASE;
  const response = await api.get<ApiResponse<ClassTimetableResponse>>(
    `${baseUrl}/class/${classPublicId}/timetable/`
  );
  return response.data.data;
}

export async function fetchClassTimetableForDate(
  classPublicId: string,
  date: string
): Promise<ClassTimetableDateResponse> {
  const response = await api.get<ApiResponse<ClassTimetableDateResponse>>(
    `${EMPLOYEE_BASE}/class/${classPublicId}/timetable/date/`,
    { params: { date } }
  );
  return response.data.data;
}

export async function fetchClassTimetableForWeek(
  classPublicId: string,
  date: string
): Promise<ClassTimetableWeekResponse> {
  const response = await api.get<ApiResponse<ClassTimetableWeekResponse>>(
    `${EMPLOYEE_BASE}/class/${classPublicId}/timetable/week/`,
    { params: { date } }
  );
  return response.data.data;
}

export async function fetchClassOverrides(
  classPublicId: string,
  date?: string
): Promise<TimetableOverride[]> {
  const response = await api.get<ApiResponse<TimetableOverride[]>>(
    `${EMPLOYEE_BASE}/class/${classPublicId}/overrides/`,
    { params: date ? { date } : {} }
  );
  return response.data.data;
}

export async function upsertTimetableOverride(
  classPublicId: string,
  data: TimetableOverrideUpsertPayload
): Promise<TimetableOverride> {
  const response = await api.post<ApiResponse<TimetableOverride>>(
    `${EMPLOYEE_BASE}/class/${classPublicId}/overrides/`,
    data
  );
  return response.data.data;
}

export async function deleteTimetableOverride(overridePublicId: string): Promise<void> {
  await api.delete(`${EMPLOYEE_BASE}/overrides/${overridePublicId}/`);
}

export async function fetchMyTimetable(): Promise<MyTimetableResponse> {
  const response = await api.get<ApiResponse<MyTimetableResponse>>(
    `${EMPLOYEE_BASE}/my-timetable/`
  );
  return response.data.data;
}

export async function fetchTeacherTimetable(teacherPublicId: string): Promise<MyTimetableResponse> {
  const response = await api.get<ApiResponse<MyTimetableResponse>>(
    `${EMPLOYEE_BASE}/teacher/${teacherPublicId}/timetable/`
  );
  return response.data.data;
}
