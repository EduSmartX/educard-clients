/**
 * Subjects List Screen (Shared)
 * Accessible from both Admin and Employee Management tabs.
 * Uses the reusable SubjectList component from features.
 */

import { SubjectList } from '@/features/subjects';

export default function SubjectsScreen() {
  return <SubjectList />;
}
