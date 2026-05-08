import { Navigate, Outlet } from 'react-router-dom';
import { DashboardHeader } from './dashboard-header';
import { DashboardLayout } from './dashboard-layout';
import { useAuth } from '../../hooks/use-auth';
import { useStorageListener } from '@/hooks/use-storage-listener';
import { getSidebarConfig } from '@/lib/utils/sidebar-utils';
import { formatRole } from '@/lib/utils/auth-utils';
import { ROUTES } from '@/constants';
import { useMyProfilePhoto } from '@/features/profile/hooks/queries';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { getThemeConfig } from '@/lib/utils/theme-utils';
import { cn } from '@/lib/utils';

/**
 * Protected Layout - Wraps all authenticated pages with header and sidebar.
 * Redirects unauthenticated users and listens for cross-tab logout events.
 */
export function ProtectedLayout() {
  const { user, organization } = useAuth();
  const { data: profilePhoto } = useMyProfilePhoto();

  useStorageListener();

  const accessToken = localStorage.getItem('access_token');
  if (!accessToken || !user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  // Get role-based theme
  const userRoleFormatted = formatRole(user?.role);
  const theme = getThemeConfig(userRoleFormatted);

  // Profile photo from attachments API takes priority over user.profile_image from login
  const avatarUrl = getMediaUrl(profilePhoto?.thumbnail_url) || user?.profile_image;

  return (
    <div className={cn("min-h-screen", theme.mainBgGradient)}>
      <DashboardHeader
        organizationName={organization?.name}
        organizationLogo={organization?.logo}
        userName={user?.full_name || user?.username}
        username={user?.username}
        userRole={userRoleFormatted}
        userAvatar={avatarUrl}
        notificationCount={3}
      />

      <DashboardLayout sidebarSections={getSidebarConfig()} userRole={userRoleFormatted}>
        <Outlet />
      </DashboardLayout>
    </div>
  );
}
