/**
 * Teachers List Screen (Shared)
 * Accessible from both Admin and Employee tabs
 * Uses the reusable TeacherList component from features
 */

import { TeacherList } from '@/features/teachers';

export default function TeachersScreen() {
  return <TeacherList />;
}
