/**
 * Employee Classes Page - View-only access to classes list
 * Teachers can view all classes in their organization (no CRUD operations)
 */

import { ClassesManagement } from '@/features/classes/components/classes-management';

export default function EmployeeClassesPage() {
  return <ClassesManagement viewMode="employee" />;
}
