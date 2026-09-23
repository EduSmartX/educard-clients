/**
 * Set New Password Page
 * Mandatory password change shown on first login (default password still active).
 */

import { AlertTriangle } from 'lucide-react';
import { PasswordChangeForm } from '@/features/profile/components/password-change-form';

export default function SetNewPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="flex items-start gap-3 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
          You're signed in with a default password. Please set a new password to continue.
        </p>
      </div>
      <PasswordChangeForm />
    </div>
  );
}
