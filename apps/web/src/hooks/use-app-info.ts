/**
 * useAppInfo — fetches company/support info (name, email, phone, user-manual URL)
 * from the backend so these values aren't hardcoded. Public + cached.
 */

import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

export interface AppInfo {
  company_name: string;
  support_email: string;
  support_phone: string;
  website_url: string;
  user_manual_url: string;
}

async function fetchAppInfo(): Promise<AppInfo> {
  const response = await api.get<{ data: AppInfo }>('/core/app-info/');
  return response.data.data;
}

export function useAppInfo() {
  return useQuery({
    queryKey: ['app-info'],
    queryFn: fetchAppInfo,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
