/**
 * Student Dashboard API
 * API functions for the Student Portal dashboard (self-service).
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiDetailResponse, StudentDashboard } from '@educard/shared';

/**
 * Get the authenticated student's dashboard summary
 * (attendance %, today's timetable, pending homework/exam counts).
 */
export async function getStudentDashboard(): Promise<ApiDetailResponse<StudentDashboard>> {
  const response = await api.get<ApiDetailResponse<StudentDashboard>>(
    API_ENDPOINTS.STUDENT_PORTAL.DASHBOARD
  );
  return response.data;
}
