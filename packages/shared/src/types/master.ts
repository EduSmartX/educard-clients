/**
 * Master / Core Data Types
 *
 * Reference data types used across the application:
 * core classes (grade levels), core subjects, role types.
 * Used across Web, iOS, and Android.
 *
 * @module types/master
 */

/** Core class / grade level (e.g. "Class 1", "Class 10", "Nehru") */
export interface CoreClass {
  id: number;
  name: string;
  code?: string;
  display_order?: number;
}

/** Core subject master (e.g. "Mathematics", "English") */
export interface CoreSubject {
  id: number;
  name: string;
  code?: string;
}

/** Organization role type (e.g. "Teacher", "Admin", "Clerk") */
export interface RoleType {
  id: number;
  name: string;
  code?: string;
}

/** Department (e.g. "Science", "Arts") */
export interface Department {
  id: number;
  name: string;
  code?: string;
}

// Supervisor is exported from ./common.ts — do not duplicate here

/** Generic list response for master data endpoints */
export interface MasterListResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T[];
}
