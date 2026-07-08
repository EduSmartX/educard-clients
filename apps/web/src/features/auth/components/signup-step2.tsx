import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Mail, Building2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FormPlaceholders } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthActionButtons } from './auth-action-buttons';
import type { Step2Data } from '../utils/signup.schemas';
import { formatResendCountdown } from '../utils/signup.utils';

interface SignupStep2Props {
  form: UseFormReturn<Step2Data>;
  formData: { adminEmail?: string; orgEmail?: string };
  useSameEmail: boolean;
  adminOtpVerified: boolean;
  orgOtpVerified: boolean;
  verifyingAdmin: boolean;
  verifyingOrg: boolean;
  adminResendCooldown: number;
  orgResendCooldown: number;
  otpSentMessage: string;
  adminOtpLabel: string;
  adminOtpIcon: string;
  adminOtpInputClass: string;
  adminVerifyBtnClass: string;
  onVerifyAdmin: () => void;
  onVerifyOrg: () => void;
  onResendAdmin: () => void;
  onResendOrg: () => void;
  onSubmit: (data: Step2Data) => void;
  onBack: () => void;
}

export function SignupStep2({
  form,
  formData,
  useSameEmail,
  adminOtpVerified,
  orgOtpVerified,
  verifyingAdmin,
  verifyingOrg,
  adminResendCooldown,
  orgResendCooldown,
  otpSentMessage,
  adminOtpLabel,
  adminOtpIcon,
  adminOtpInputClass,
  adminVerifyBtnClass,
  onVerifyAdmin,
  onVerifyOrg,
  onResendAdmin,
  onResendOrg,
  onSubmit,
  onBack,
}: SignupStep2Props) {
  const allVerified = useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3">
          <ShieldCheck className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Verify Your Emails</h3>
          <p className="text-sm text-gray-500">Enter the codes we sent you</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 rounded-xl border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
            <span className="text-lg text-amber-600">📧</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-amber-800">{otpSentMessage}</p>
      </div>

      {/* Admin OTP */}
      <div className="space-y-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
        <Label
          htmlFor="adminOtp"
          className="flex items-center gap-2 text-base font-bold text-gray-800"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-sm text-white">
            {adminOtpIcon}
          </span>
          {adminOtpLabel}
          <span className="text-red-500">*</span>
        </Label>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              id="adminOtp"
              type="text"
              maxLength={6}
              placeholder={FormPlaceholders.OTP_MASK}
              className={`h-14 rounded-xl border-2 text-center text-2xl font-bold tracking-[0.5em] transition-all ${adminOtpInputClass}`}
              error={form.formState.errors.adminOtp?.message}
              disabled={adminOtpVerified}
              {...form.register('adminOtp')}
            />
          </div>
          <Button
            type="button"
            onClick={onVerifyAdmin}
            disabled={adminOtpVerified || verifyingAdmin}
            isLoading={verifyingAdmin}
            className={`h-14 min-w-[120px] rounded-xl font-semibold transition-all ${adminVerifyBtnClass}`}
          >
            {adminOtpVerified ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Verified
              </span>
            ) : (
              'Verify'
            )}
          </Button>
        </div>

        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Mail className="h-4 w-4" />
          Sent to: <span className="font-medium text-gray-700">{formData.adminEmail}</span>
        </p>

        {!adminOtpVerified && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Didn't get the code?</p>
            {adminResendCooldown > 0 ? (
              <p className="text-xs font-medium text-gray-500">
                Resend available in {formatResendCountdown(adminResendCooldown)}
              </p>
            ) : (
              <button
                type="button"
                onClick={onResendAdmin}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}
      </div>

      {/* Organization OTP - Only show if different emails */}
      {!useSameEmail && (
        <div className="space-y-4 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
          <Label
            htmlFor="orgOtp"
            className="flex items-center gap-2 text-base font-bold text-gray-800"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-sm text-white">
              🏢
            </span>
            <span>Organization Email Code</span>
            <span className="text-red-500">*</span>
          </Label>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                id="orgOtp"
                type="text"
                maxLength={6}
                placeholder={FormPlaceholders.OTP_MASK}
                className={`h-14 rounded-xl border-2 text-center text-2xl font-bold tracking-[0.5em] transition-all ${
                  orgOtpVerified
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50'
                }`}
                error={form.formState.errors.orgOtp?.message}
                disabled={orgOtpVerified}
                {...form.register('orgOtp')}
              />
            </div>
            <Button
              type="button"
              onClick={onVerifyOrg}
              disabled={orgOtpVerified || verifyingOrg}
              isLoading={verifyingOrg}
              className={`h-14 min-w-[120px] rounded-xl font-semibold transition-all ${
                orgOtpVerified
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-105 hover:shadow-xl'
              }`}
            >
              {orgOtpVerified ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Verified
                </span>
              ) : (
                'Verify'
              )}
            </Button>
          </div>

          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" />
            Sent to: <span className="font-medium text-gray-700">{formData.orgEmail}</span>
          </p>

          {!orgOtpVerified && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Didn't get the code?</p>
              {orgResendCooldown > 0 ? (
                <p className="text-xs font-medium text-gray-500">
                  Resend available in {formatResendCountdown(orgResendCooldown)}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={onResendOrg}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {allVerified && (
        <div className="animate-in fade-in slide-in-from-top-2 flex gap-3 rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-5 duration-500">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-green-800">
              {useSameEmail ? 'Email Verified! 🎉' : 'Both Emails Verified! 🎉'}
            </p>
            <p className="mt-1 text-sm text-green-700">
              You're all set! Click continue to proceed to the next step.
            </p>
          </div>
        </div>
      )}

      <AuthActionButtons
        secondaryLabel="Previous"
        primaryLabel="Continue"
        onSecondaryClick={onBack}
        primaryDisabled={!allVerified}
        containerClassName="pt-4"
        secondaryIcon={<ArrowLeft className="mr-2 h-5 w-5" />}
        primaryIcon={<ArrowRight className="ml-2 h-5 w-5" />}
      />
    </form>
  );
}
