/**
 * Students List Screen (Shared)
 * Accessible from both Admin and Employee tabs
 * Uses the reusable StudentList component from features
 */

import { StudentList } from '@/features/students';

export default function StudentsScreen() {
  return <StudentList />;
}
