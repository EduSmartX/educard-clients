import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { GraduationCap, LogIn } from 'lucide-react';
import { authApi, type ProfileSummary } from '@/lib/api/auth-api';
import { SuccessMessages } from '@/constants';
import { ROUTES } from '@/constants/app-config';
import { BRANDING } from '@/constants/branding';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding';
import { getDashboardRoute } from '@/lib/utils/auth-utils';

interface SelectProfileLocationState {
  selectionToken?: string;
  profiles?: ProfileSummary[];
  organization?: { name?: string };
}

export default function SelectProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);

  const state = (location.state as SelectProfileLocationState | null) ?? null;
  const selectionToken = state?.selectionToken;
  const profiles = state?.profiles ?? [];

  if (!selectionToken || profiles.length === 0) {
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
    return null;
  }

  const handleSelect = async (profile: ProfileSummary) => {
    setLoadingProfileId(profile.public_id);
    try {
      const response = await authApi.selectProfile({
        selection_token: selectionToken,
        user_public_id: profile.public_id,
      });
      toast.success(SuccessMessages.LOGIN_SUCCESS);
      navigate(getDashboardRoute(response.user.role), { replace: true });
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string; detail?: string } } };
      const errorMessage =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.detail ||
        'Unable to select this profile. Please try logging in again.';
      toast.error(errorMessage);
      setLoadingProfileId(null);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.15, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-lg"
      >
        <div className="space-y-8 rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Logo variant="icon" size="xl" withGlow withRing />
            </div>
            <div>
              <h1 className="mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent">
                Select a Profile
              </h1>
              <p className="text-base text-gray-600">
                Multiple students share this login for {BRANDING.APP_NAME}. Choose which profile to
                continue with.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {profiles.map((profile) => (
              <button
                key={profile.public_id}
                type="button"
                disabled={loadingProfileId !== null}
                onClick={() => handleSelect(profile)}
                className="flex w-full items-center justify-between rounded-2xl border-2 border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-teal-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{profile.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {profile.class_name}
                      {profile.roll_number ? ` · Roll No. ${profile.roll_number}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loadingProfileId !== null}
                  className="gap-2 text-teal-700"
                >
                  {loadingProfileId === profile.public_id ? (
                    'Continuing...'
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Continue
                    </>
                  )}
                </Button>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
