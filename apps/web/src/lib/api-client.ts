// Adapter for backward-compatible import path
// Some modules import { apiClient } from '@/lib/api-client'
// while the canonical axios instance lives in '@/lib/api'.

import apiClientDefault from './api';

export const apiClient = apiClientDefault;
export default apiClientDefault;
