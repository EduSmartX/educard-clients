/**
 * App Info API — company/support info (name, email, phone, user manual) shown in
 * Help & Support and dashboards. Served from the backend so it isn't hardcoded.
 */

import apiClient from './client';

export interface AppInfo {
  company_name: string;
  support_email: string;
  support_phone: string;
  website_url: string;
  user_manual_url: string;
}

interface AppInfoResponse {
  success: boolean;
  message: string;
  data: AppInfo;
  code: number;
}

export async function fetchAppInfo(): Promise<AppInfo> {
  const response = await apiClient.get<AppInfoResponse>('/core/app-info/');
  return response.data.data;
}
