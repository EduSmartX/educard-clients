import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GraduationCap, LogIn } from 'lucide-react';
import { authApi, type ProfileSummary } from '@/lib/api/auth-api';
import { ROUTES } from '@/constants/app-config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SwitchProfileDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * Lets a student pick another active student profile that shares the same
 * login email, then switches the current session to it without re-entering
 * a password.
 */
export function SwitchProfileDialog({ open, onOpenChange }: SwitchProfileDialogProps) {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setIsLoading(true);
    authApi
      .getLinkedProfiles()
      .then(setProfiles)
      .catch(() => {
        toast.error('Unable to load linked profiles.');
      })
      .finally(() => setIsLoading(false));
  }, [open]);

  const handleSwitch = async (profile: ProfileSummary) => {
    if (profile.is_current) {
      onOpenChange(false);
      return;
    }
    setSwitchingId(profile.public_id);
    try {
      await authApi.switchProfile({ user_public_id: profile.public_id });
      toast.success(`Switched to ${profile.full_name}.`);
      // Full page reload (rather than client-side navigate) so all auth
      // context / React Query caches reset for the newly-switched profile.
      globalThis.location.href = ROUTES.STUDENT.DASHBOARD;
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError?.response?.data?.message || 'Unable to switch profile.');
      setSwitchingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Profile</DialogTitle>
          <DialogDescription>Choose another linked student profile to switch to.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <button
                key={profile.public_id}
                type="button"
                disabled={switchingId !== null}
                onClick={() => handleSwitch(profile)}
                className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-all hover:border-teal-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {profile.full_name}
                      {profile.is_current && (
                        <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profile.class_name}
                      {profile.roll_number ? ` · Roll No. ${profile.roll_number}` : ''}
                    </p>
                  </div>
                </div>
                {!profile.is_current && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={switchingId !== null}
                    className="gap-2 text-teal-700"
                  >
                    {switchingId === profile.public_id ? (
                      'Switching...'
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        Switch
                      </>
                    )}
                  </Button>
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
