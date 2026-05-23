/**
 * Employee Info Card - Shared Component
 * Displays employee/user profile information in various layouts.
 * Used in attendance reports, leave dashboards, timesheet pages, etc.
 */
import type { ReactNode } from 'react';
import { UserCircle2, Mail, Phone, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface EmployeeInfoUser {
  public_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  role_display?: string;
  organization_role?: string | { code?: string; name?: string } | null;
  employee_id?: string;
  profile_image?: string;
}

interface EmployeeInfoCardProps {
  user: EmployeeInfoUser;
  organization?: { name?: string };
  employeeId?: string | null;
  /** 'compact' = small card, 'profile' = with avatar, 'banner' = horizontal with gradient */
  variant?: 'compact' | 'profile' | 'banner';
  /** Optional action button (e.g. "Back to Reviews") */
  action?: ReactNode;
  className?: string;
}

function getDisplayName(user: EmployeeInfoUser): string {
  if (user.full_name) {
    return user.full_name;
  }
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.username || '-';
}

function getInitials(user: EmployeeInfoUser): string {
  if (user.full_name) {
    return user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.username?.[0]?.toUpperCase() || 'U';
}

function getOrganizationRoleLabel(role: EmployeeInfoUser['organization_role']): string | null {
  if (!role) {
    return null;
  }
  if (typeof role === 'string') {
    return role;
  }
  return role.name || null;
}

export function EmployeeInfoCard({
  user,
  organization,
  employeeId,
  variant = 'compact',
  action,
  className = '',
}: Readonly<EmployeeInfoCardProps>) {
  const displayName = getDisplayName(user);
  const initials = getInitials(user);
  const orgRole = getOrganizationRoleLabel(user.organization_role);
  const effectiveEmployeeId = employeeId || user.employee_id;

  if (variant === 'banner') {
    return (
      <Card className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-blue-300">
                <AvatarImage src={user.profile_image} alt={displayName} />
                <AvatarFallback className="bg-blue-200 text-xl font-semibold text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                  {!!orgRole && <p className="text-sm text-gray-600">{orgRole}</p>}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                  {!!user.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {!!user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {!!effectiveEmployeeId && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>ID: {effectiveEmployeeId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {action}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'profile') {
    return (
      <Card className={`border-0 bg-white shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle2 className="h-5 w-5 text-emerald-700" />
            Employee Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profile_image} alt={displayName} />
                <AvatarFallback className="bg-emerald-100 text-2xl font-semibold text-emerald-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-1.5 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Name:</span> {displayName}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {user.email || '-'}
              </p>
              <p>
                <span className="font-semibold">Role:</span> {user.role || '-'}
              </p>
              {!!orgRole && (
                <p>
                  <span className="font-semibold">Organization Role:</span> {orgRole}
                </p>
              )}
              {organization?.name && (
                <p>
                  <span className="font-semibold">Organization:</span> {organization.name}
                </p>
              )}
              {!!effectiveEmployeeId && (
                <p>
                  <span className="font-semibold">Employee ID:</span> {effectiveEmployeeId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant (default)
  return (
    <Card className={`border-0 bg-white/85 shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCircle2 className="h-5 w-5 text-emerald-700" />
          Employee Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Name:</span> {displayName}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {user.email || '-'}
        </p>
        <p>
          <span className="font-semibold">Role:</span> {user.role || '-'}
        </p>
        {!!orgRole && (
          <p>
            <span className="font-semibold">Organization Role:</span> {orgRole}
          </p>
        )}
        {organization?.name && (
          <p>
            <span className="font-semibold">Organization:</span> {organization.name}
          </p>
        )}
        {!!effectiveEmployeeId && (
          <p>
            <span className="font-semibold">Employee ID:</span> {effectiveEmployeeId}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
