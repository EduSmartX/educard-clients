import { UserCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EmployeeInfoCardProps {
  user: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    role?: string;
    public_id?: string;
    profile_image?: string;
  };
  organization?: {
    name?: string;
  };
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
}: EmployeeInfoCardProps) {
  const displayName = user.full_name || 
    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) || 
    '-';
  
  const initials = user.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user.username?.[0]?.toUpperCase() || 'U';

  if (showProfileImage) {
    return (
      <Card className={`border-0 bg-white shadow-sm ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-emerald-700" />
            Employee Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Profile Image - Left Side */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profile_image} alt={displayName} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Information - Right Side */}
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
              {organizationRole && (
                <p>
                  <span className="font-semibold">Organization Role:</span> {organizationRole}
                </p>
              )}
              {organization?.name && (
                <p>
                  <span className="font-semibold">Organization:</span> {organization.name}
                </p>
              )}
              {employeeId && (
                <p>
                  <span className="font-semibold">Employee ID:</span> {employeeId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact version without profile image
  return (
    <Card className={`border-0 bg-white/85 shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
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
        {organizationRole && (
          <p>
            <span className="font-semibold">Organization Role:</span> {organizationRole}
          </p>
        )}
        {organization?.name && (
          <p>
            <span className="font-semibold">Organization:</span> {organization.name}
          </p>
        )}
        {employeeId && (
          <p>
            <span className="font-semibold">Employee ID:</span> {employeeId}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
