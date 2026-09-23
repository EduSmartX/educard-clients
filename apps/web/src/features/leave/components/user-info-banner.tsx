/**
 * User Info Banner Component
 * Displays user profile information when viewing another user's leave dashboard.
 * Uses the shared EmployeeInfoCard with 'banner' variant.
 */
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmployeeInfoCard, type EmployeeInfoUser } from '@/components/common/employee-info-card';

export type UserInfo = EmployeeInfoUser & {
  role_display?: string;
};

interface UserInfoBannerProps {
  userInfo: UserInfo;
  onBack: () => void;
}

export function UserInfoBanner({ userInfo, onBack }: Readonly<UserInfoBannerProps>) {
  return (
    <EmployeeInfoCard
      user={userInfo}
      variant="banner"
      action={
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </Button>
      }
    />
  );
}
