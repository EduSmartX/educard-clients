/**
 * Core Classes API
 * API calls for core classes (master data - Pre-KG, Class 1, etc.)
 */

import api from '@/lib/api';

export interface CoreClass {
  id: number;
  name: string; // e.g., "Pre-KG", "Class 1", "Class 10"
  code: string; // e.g., "PRE_KG", "CLASS_1", "CLASS_10"
  display_order: number;
  description: string;
}

export interface CoreClassesResponse {
  status: string;
  message: string;
  data: CoreClass[];
}

const BASE_URL = '/core/classes';

export async function fetchCoreClasses(): Promise<CoreClass[]> {
  const response = await api.get<CoreClassesResponse>(BASE_URL);
  return response.data.data;
}
