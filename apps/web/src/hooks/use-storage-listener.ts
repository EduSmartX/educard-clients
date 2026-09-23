import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { tokenManager } from '@/lib/token-manager';

export function useStorageListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Listen for explicit logout events (e.g., password change in another tab)
      if (event.key === 'logout-event') {
        // Clear in-memory token and localStorage user data
        tokenManager.clear();
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
      if (!tokenManager.isAuthenticated()) {
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
