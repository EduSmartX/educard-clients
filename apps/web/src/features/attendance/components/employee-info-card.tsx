/**
 * @deprecated Import from '@/components/common/employee-info-card' instead.
 * This file is kept for backward compatibility.
 */
import {
  EmployeeInfoCard as SharedEmployeeInfoCard,
  type EmployeeInfoUser,
} from '@/components/common/employee-info-card';

interface EmployeeInfoCardProps {
  user: EmployeeInfoUser;
  organization?: { name?: string };
  organizationRole?: string | null;
  employeeId?: string | null;
  showProfileImage?: boolean;
  className?: string;
}

export function EmployeeInfoCard({
  user,
  organization,
  organizationRole,
  employeeId,
  showProfileImage = false,
  className = '',
}: Readonly<EmployeeInfoCardProps>) {
  // Map organizationRole string to user.organization_role for the shared component
  const userWithRole: EmployeeInfoUser = organizationRole
    ? { ...user, organization_role: organizationRole }
    : user;

  return (
    <SharedEmployeeInfoCard
      user={userWithRole}
      organization={organization}
      employeeId={employeeId}
      variant={showProfileImage ? 'profile' : 'compact'}
      className={className}
    />
  );
}
