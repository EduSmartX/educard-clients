/**
 * Core Feature — API Layer
 * Master/reference data: core classes, subjects, role types, uploads
 */

import { API_ENDPOINTS } from '@educard/shared';
import type {
  CoreClass,
  CoreSubject,
  RoleType,
  Department,
  Supervisor,
  LeaveType,
  MasterListResponse,
  ApiListResponse,
} from '@educard/shared';

import { apiClient } from '@/api/client';

// Re-export types for consumers
export type { CoreClass, CoreSubject, RoleType, Department, Supervisor, LeaveType };

export async function getCoreClasses(): Promise<CoreClass[]> {
  const res = await apiClient.get<MasterListResponse<CoreClass>>(API_ENDPOINTS.MASTER.CLASSES.LIST);
  return res.data.data || (res.data as any);
}

export async function getCoreSubjects(): Promise<CoreSubject[]> {
  const res = await apiClient.get<MasterListResponse<CoreSubject>>(
    API_ENDPOINTS.MASTER.SUBJECTS.LIST
  );
  return res.data.data || (res.data as any);
}

export async function getRoleTypes(): Promise<RoleType[]> {
  const res = await apiClient.get<MasterListResponse<RoleType>>(
    API_ENDPOINTS.MASTER.ROLE_TYPES.LIST
  );
  return res.data.data || (res.data as any);
}

export async function getDepartments(): Promise<Department[]> {
  const res = await apiClient.get<MasterListResponse<Department>>(
    API_ENDPOINTS.MASTER.DEPARTMENTS.LIST
  );
  return res.data.data || (res.data as any);
}

export async function getSupervisors(): Promise<Supervisor[]> {
  const res = await apiClient.get<ApiListResponse<Supervisor>>(API_ENDPOINTS.USERS.SUPERVISORS);
  return res.data?.data || (res.data as any);
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const res = await apiClient.get<MasterListResponse<LeaveType>>(
    API_ENDPOINTS.MASTER.LEAVE_TYPES.LIST
  );
  return res.data.data || (res.data as any);
}

export async function uploadProfilePhoto(userPublicId: string, uri: string, fileName: string) {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName || 'photo.jpg',
    type: 'image/jpeg',
  } as any);
  formData.append('image_type', 'profile_photo');

  return apiClient.post(API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
