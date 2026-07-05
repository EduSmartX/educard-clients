import { Navigate, Outlet } from 'react-router-dom';
import { DashboardHeader } from './dashboard-header';
import { DashboardLayout } from './dashboard-layout';
import { useAuth } from '../../hooks/use-auth';
import { useStorageListener } from '@/hooks/use-storage-listener';
import { getSidebarConfig } from '@/lib/utils/sidebar-utils';
import { formatRole } from '@/lib/utils/auth-utils';
import { ROUTES, USER_ROLES } from '@/constants';
import { useMyProfilePhoto } from '@/features/profile/hooks/queries';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { getThemeConfig } from '@/lib/utils/theme-utils';
import { cn } from '@/lib/utils';
import { useTeacherManagementContext } from '@/features/leave/hooks/use-teacher-management-context';
import { tokenManager } from '@/lib/token-manager';

/**
 * Protected Layout - Wraps all authenticated pages with header and sidebar.
 * Redirects unauthenticated users and listens for cross-tab logout events.
 */
export function ProtectedLayout() {
  const { user, organization } = useAuth();
  const { data: profilePhoto } = useMyProfilePhoto();
  const { data: managementContext } = useTeacherManagementContext();

  useStorageListener();

  if (!tokenManager.isAuthenticated() || !user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  // Get role-based theme
  const userRoleFormatted = formatRole(user?.role);
  const theme = getThemeConfig(userRoleFormatted);

  // Profile photo from attachments API takes priority over user.profile_image from login
  const avatarUrl = getMediaUrl(profilePhoto?.thumbnail_url) || user?.profile_image;

  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isSupervisor = isAdmin || managementContext?.can_review_requests || false;
  const isStudent = user?.role === USER_ROLES.STUDENT;

  return (
    <div className={cn('min-h-screen', theme.mainBgGradient)}>
      <DashboardHeader
        organizationName={organization?.name}
        organizationLogo={organization?.logo}
        userName={user?.full_name || user?.username}
        username={user?.username}
        userRole={userRoleFormatted}
        userAvatar={avatarUrl}
        notificationCount={3}
        showSwitchProfile={isStudent}
      />

      <DashboardLayout
        sidebarSections={getSidebarConfig()}
        userRole={userRoleFormatted}
        isSupervisor={isSupervisor}
      >
        <Outlet />
      </DashboardLayout>
    </div>
  );
}
