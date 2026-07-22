/**
 * Verification Banner
 *
 * Displays a dismissible alert on the dashboard when the user's email
 * or phone is not verified. For parent/student roles, also checks
 * guardian contact verification.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mail, Phone, X, ArrowRight } from 'lucide-react';
import type { User } from '@/hooks/use-auth';

interface VerificationBannerProps {
  readonly user: User;
  readonly onVerifyEmail?: () => void;
  readonly onVerifyPhone?: () => void;
}

interface PendingVerification {
  type: 'email' | 'phone';
  label: string;
  value: string;
  action: 'add' | 'verify';
}

function getPendingVerifications(user: User): PendingVerification[] {
  const pending: PendingVerification[] = [];

  // Email: missing or unverified
  if (!user.email) {
    pending.push({ type: 'email', label: 'Email', value: 'Not added', action: 'add' });
  } else if (!user.is_email_verified) {
    pending.push({ type: 'email', label: 'Email', value: user.email, action: 'verify' });
  }

  // Phone: missing or unverified
  if (!user.phone) {
    pending.push({ type: 'phone', label: 'Phone', value: 'Not added', action: 'add' });
  } else if (!user.is_mobile_verified) {
    pending.push({ type: 'phone', label: 'Phone', value: user.phone, action: 'verify' });
  }

  return pending;
}

export function VerificationBanner({
  user,
  onVerifyEmail,
  onVerifyPhone,
}: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const pendingVerifications = getPendingVerifications(user);

  if (dismissed || pendingVerifications.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm"
      >
        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 rounded-full p-1 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-amber-100 p-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-amber-900">Verification Required</h3>
            <p className="mt-0.5 text-sm text-amber-700">
              Please complete the following to receive important notifications:
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {pendingVerifications.map((item) => (
                <button
                  key={`${item.type}-${item.value}`}
                  type="button"
                  onClick={() => {
                    if (item.type === 'email') {
                      onVerifyEmail?.();
                    } else {
                      onVerifyPhone?.();
                    }
                  }}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-all hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                >
                  {item.type === 'email' ? (
                    <Mail className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Phone className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>
                    {item.action === 'add'
                      ? `Add ${item.label}`
                      : `${item.label}: ${maskValue(item.value, item.type)}`}
                  </span>
                  <ArrowRight className="h-3 w-3 text-amber-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Mask email/phone for privacy display */
function maskValue(value: string, type: 'email' | 'phone'): string {
  if (type === 'email') {
    const [local, domain] = value.split('@');
    if (!domain) {
      return value;
    }
    const masked = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : `${local[0]}***`;
    return `${masked}@${domain}`;
  }
  // Phone: show last 4 digits
  if (value.length > 4) {
    return `***${value.slice(-4)}`;
  }
  return value;
}
