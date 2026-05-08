import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

export function useStorageListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // If access_token is removed in another tab, logout this tab too
      if (event.key === 'access_token' && event.newValue === null) {
        // Redirect to login page
        window.location.href = ROUTES.AUTH.LOGIN;
      }

      // Listen for explicit logout events (e.g., password change)
      if (event.key === 'logout-event') {
        // Clear all storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        // Redirect to login
        window.location.href = ROUTES.AUTH.LOGIN;
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Prevent back button navigation after logout
  useEffect(() => {
    const handlePopState = () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        window.history.pushState(null, '', ROUTES.AUTH.LOGIN);
        navigate(ROUTES.AUTH.LOGIN, { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);
}
