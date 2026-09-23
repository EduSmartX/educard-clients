/**
 * Employee Teachers Page - View-only access to teachers list
 * Teachers can view their colleagues' information (no CRUD operations)
 */

import { TeachersManagement } from '@/features/teachers/components/teachers-management';

export default function EmployeeTeachersPage() {
  return <TeachersManagement viewMode="employee" />;
}
