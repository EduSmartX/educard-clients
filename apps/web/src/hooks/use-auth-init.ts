/**
 * Auth initializer — attempts a silent refresh on page load.
 *
 * Since the access token lives only in memory, a page refresh loses it.
 * This hook calls the refresh endpoint (which reads the HttpOnly cookie)
 * to restore the session without requiring re-login.
 */

import { useEffect, useState } from 'react';
import axios from 'axios';
import { tokenManager } from '@/lib/token-manager';
import { getUserProfile } from '@/features/profile/api/profile-api';
import { updateStoredUser } from '@/lib/utils/storage';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://educard-backend-api-272236662775.asia-south1.run.app/api';

export function useAuthInit() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const silentRefresh = async () => {
      // If there's a stored user, try to restore the session via cookie
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setIsReady(true);
        return;
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        tokenManager.setAccessToken(response.data.access);
        // Refresh verification flags so a stale banner self-heals without re-login.
        try {
          const profile = await getUserProfile();
          updateStoredUser({
            email: profile.data.email,
            phone: profile.data.phone,
            is_email_verified: profile.data.is_email_verified,
            is_mobile_verified: profile.data.is_mobile_verified,
          });
        } catch {
          // Non-fatal: keep the cached user if the profile refresh fails.
        }
      } catch {
        // Cookie expired or invalid — user will be redirected to login
        tokenManager.clear();
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
      } finally {
        setIsReady(true);
      }
    };

    silentRefresh();
  }, []);

  return { isReady };
}
