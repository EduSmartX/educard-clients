/**
 * Shared API - Attendance
 * Pure API functions for attendance module
 */

import type { AxiosInstance } from 'axios';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { 
  AttendanceStatusType,
  AttendanceRecord,
  AttendanceSummary,
} from '../types/attendance';

// API-specific payload types (simplified for this API layer)
export interface MarkAttendanceData {
  student_id: string;
  date: string;
  status: AttendanceStatusType;
  check_in_time?: string;
  remarks?: string;
}

export interface BulkAttendanceData {
  class_id: string;
  date: string;
  records: {
    student_id: string;
    status: AttendanceStatusType;
    remarks?: string;
  }[];
}

/**
 * Create attendance API endpoints
 */
export function createAttendanceApi(client: AxiosInstance) {
  return {
    /**
     * Get attendance records with filters
     */
    getAll: async (params?: PaginationParams & {
      class_id?: string;
      student_id?: string;
      date?: string;
      start_date?: string;
      end_date?: string;
      status?: AttendanceStatusType;
    }): Promise<PaginatedResponse<AttendanceRecord>> => {
      const response = await client.get<PaginatedResponse<AttendanceRecord>>('/attendance/', { params });
      return response.data;
    },

    /**
     * Get attendance for a specific date and class
     */
    getByDateAndClass: async (date: string, classId: string): Promise<AttendanceRecord[]> => {
      const response = await client.get<ApiResponse<AttendanceRecord[]>>('/attendance/', {
        params: { date, class_id: classId },
      });
      return response.data.data;
    },

    /**
     * Mark attendance for a single student
     */
    mark: async (data: MarkAttendanceData): Promise<AttendanceRecord> => {
      const response = await client.post<ApiResponse<AttendanceRecord>>('/attendance/', data);
      return response.data.data;
    },

    /**
     * Mark attendance for multiple students (bulk)
     */
    markBulk: async (data: BulkAttendanceData): Promise<AttendanceRecord[]> => {
      const response = await client.post<ApiResponse<AttendanceRecord[]>>('/attendance/bulk/', data);
      return response.data.data;
    },

    /**
     * Update attendance record
     */
    update: async (id: string, data: Partial<MarkAttendanceData>): Promise<AttendanceRecord> => {
      const response = await client.patch<ApiResponse<AttendanceRecord>>(`/attendance/${id}/`, data);
      return response.data.data;
    },

    /**
     * Get attendance summary for a student
     */
    getStudentSummary: async (studentId: string, params?: {
      start_date?: string;
      end_date?: string;
      month?: number;
      year?: number;
    }): Promise<AttendanceSummary> => {
      const response = await client.get<ApiResponse<AttendanceSummary>>(
        `/students/${studentId}/attendance/summary/`,
        { params }
      );
      return response.data.data;
    },

    /**
     * Get attendance summary for a class
     */
    getClassSummary: async (classId: string, date: string): Promise<{
      total_students: number;
      present: number;
      absent: number;
      late: number;
    }> => {
      const response = await client.get<ApiResponse<{
        total_students: number;
        present: number;
        absent: number;
        late: number;
      }>>(`/classes/${classId}/attendance/summary/`, { params: { date } });
      return response.data.data;
    },
  };
}

export type AttendanceApi = ReturnType<typeof createAttendanceApi>;
