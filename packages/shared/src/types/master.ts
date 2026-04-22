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

/** Supervisor / Organization user available for supervisor selection */
export interface Supervisor {
  public_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: string;
  role_display: string;
  organization_role?: string;
  gender?: string;
  employee_id?: string;
  subjects?: string[];
}

/** Leave type (e.g. "Casual Leave", "Sick Leave") */
export interface LeaveType {
  id: number;
  name: string;
  code?: string;
}

/** Generic list response for master data endpoints */
export interface MasterListResponse<T> {
  code: number;
  success: boolean;
  message: string;
  data: T[];
}
