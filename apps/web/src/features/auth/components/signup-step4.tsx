import { ArrowLeft, CheckCircle2, Smartphone, User } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { GENDER_OPTIONS } from '@educard/shared';
import { FormPlaceholders } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PhoneInput } from '@/components/form/phone-input';
import { AuthActionButtons } from './auth-action-buttons';
import type { Step4Data } from '../utils/signup.schemas';
import { formatResendCountdown } from '../utils/signup.utils';

interface SignupStep4Props {
  readonly form: UseFormReturn<Step4Data>;
  readonly formData: {
    orgName?: string;
    orgEmail?: string;
    adminEmail?: string;
    city?: string;
    state?: string;
  };
  readonly isLoading: boolean;
  readonly adminPhoneOtpVerified: boolean;
  readonly sendingAdminPhoneOtp: boolean;
  readonly verifyingAdminPhoneOtp: boolean;
  readonly adminPhoneResendCooldown: number;
  readonly onSendAdminPhoneOtp: () => void;
  readonly onVerifyAdminPhoneOtp: () => void;
  readonly onSubmit: (data: Step4Data) => void;
  readonly onBack: () => void;
}

export function SignupStep4({
  form,
  formData,
  isLoading,
  adminPhoneOtpVerified,
  sendingAdminPhoneOtp,
  verifyingAdminPhoneOtp,
  adminPhoneResendCooldown,
  onSendAdminPhoneOtp,
  onVerifyAdminPhoneOtp,
  onSubmit,
  onBack,
}: SignupStep4Props) {
  const canTeach = form.watch('canTeachSubject');
  const phoneNumber = form.watch('phoneNumber');
  const hasPhone = Boolean(phoneNumber && phoneNumber !== '+91');
  const otpSent = adminPhoneResendCooldown > 0;

  const primaryOtpAction = () => {
    if (adminPhoneOtpVerified) {
      return;
    }
    if (otpSent) {
      onVerifyAdminPhoneOtp();
      return;
    }
    onSendAdminPhoneOtp();
  };

  let primaryOtpLabel = 'Send OTP';
  if (adminPhoneOtpVerified) {
    primaryOtpLabel = 'Verified';
  } else if (otpSent) {
    primaryOtpLabel = verifyingAdminPhoneOtp ? 'Verifying...' : 'Verify OTP';
  } else if (sendingAdminPhoneOtp) {
    primaryOtpLabel = 'Sending...';
  }

  const primaryOtpDisabled =
    adminPhoneOtpVerified || sendingAdminPhoneOtp || verifyingAdminPhoneOtp;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="mb-4 flex items-center gap-2 text-teal-700">
        <User className="h-5 w-5" />
        <h3 className="font-semibold">Administrator Account</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder={FormPlaceholders.FIRST_NAME_EXAMPLE}
            className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            error={form.formState.errors.firstName?.message}
            {...form.register('firstName')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder={FormPlaceholders.LAST_NAME_EXAMPLE}
            className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            error={form.formState.errors.lastName?.message}
            {...form.register('lastName')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
            Phone Number
          </Label>
          <PhoneInput
            id="phoneNumber"
            value={form.watch('phoneNumber') || ''}
            onChange={(value: string) =>
              form.setValue('phoneNumber', value, { shouldValidate: true, shouldDirty: true })
            }
            className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            error={form.formState.errors.phoneNumber?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
            Gender {canTeach && <span className="text-red-500">*</span>}
          </Label>
          <SearchableSelect
            options={[...GENDER_OPTIONS]}
            value={form.watch('gender') || ''}
            onValueChange={(value: string) => form.setValue('gender', value)}
            placeholder="Select Gender"
            className="h-12 border-2 border-gray-300 focus:border-teal-500"
          />
          {form.formState.errors.gender && (
            <p className="text-sm text-red-600">{form.formState.errors.gender.message}</p>
          )}
        </div>
      </div>

      {hasPhone && (
        <div className="space-y-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="adminPhoneOtp"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <Smartphone className="h-4 w-4 text-teal-600" />
              Mobile OTP Verification
            </Label>
            {adminPhoneOtpVerified ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Verified
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Pending
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Input
              id="adminPhoneOtp"
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="h-11 border-2 border-gray-300 text-center font-bold tracking-[0.3em] focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              error={form.formState.errors.adminPhoneOtp?.message}
              disabled={adminPhoneOtpVerified}
              {...form.register('adminPhoneOtp')}
            />
            <Button
              type="button"
              onClick={primaryOtpAction}
              disabled={primaryOtpDisabled}
              isLoading={sendingAdminPhoneOtp || verifyingAdminPhoneOtp}
              className="h-11 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-4 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {primaryOtpLabel}
            </Button>
          </div>

          <div>
            <Button
              type="button"
              onClick={onSendAdminPhoneOtp}
              disabled={
                adminPhoneOtpVerified || sendingAdminPhoneOtp || adminPhoneResendCooldown > 0
              }
              isLoading={sendingAdminPhoneOtp}
              className="h-10 rounded-lg border border-teal-300 bg-white px-4 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adminPhoneResendCooldown > 0
                ? `Resend OTP in ${formatResendCountdown(adminPhoneResendCooldown)}`
                : 'Resend OTP'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder={FormPlaceholders.CREATE_STRONG_PASSWORD}
          className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder={FormPlaceholders.REENTER_NEW_PASSWORD}
          className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          error={form.formState.errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="notificationOptIn"
          defaultChecked
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          {...form.register('notificationOptIn')}
        />
        <Label htmlFor="notificationOptIn" className="text-sm text-gray-700">
          I want to receive email notifications about important updates
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="canTeachSubject"
          defaultChecked
          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          {...form.register('canTeachSubject')}
        />
        <Label htmlFor="canTeachSubject" className="text-sm text-gray-700">
          I can also teach a subject (create my teacher profile)
        </Label>
      </div>

      {canTeach && (
        <div className="space-y-4 rounded-lg border border-teal-200 bg-teal-50/50 p-4">
          <h4 className="text-sm font-semibold text-teal-800">Teacher Details</h4>
          <div className="space-y-2">
            <Label htmlFor="employeeId" className="text-sm font-semibold text-gray-700">
              Employee ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employeeId"
              placeholder="e.g. EMP-001"
              className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              error={form.formState.errors.employeeId?.message}
              {...form.register('employeeId')}
            />
          </div>
        </div>
      )}

      {/* Registration Summary */}
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
        <h4 className="mb-4 text-base font-semibold text-teal-800">📋 Registration Summary</h4>
        <div className="space-y-2.5 font-mono text-sm">
          <div className="flex items-center">
            <span className="w-48 font-semibold text-gray-700">Organization</span>
            <span className="mx-3 text-gray-700">:</span>
            <span className="font-sans text-gray-600">{formData.orgName}</span>
          </div>
          <div className="flex items-center">
            <span className="w-48 font-semibold text-gray-700">Organization Email</span>
            <span className="mx-3 text-gray-700">:</span>
            <span className="font-sans text-gray-600">{formData.orgEmail}</span>
          </div>
          <div className="flex items-center">
            <span className="w-48 font-semibold text-gray-700">Admin Email</span>
            <span className="mx-3 text-gray-700">:</span>
            <span className="font-sans text-gray-600">{formData.adminEmail}</span>
          </div>
          {formData.city && formData.state && (
            <div className="flex items-center">
              <span className="w-48 font-semibold text-gray-700">Location</span>
              <span className="mx-3 text-gray-700">:</span>
              <span className="font-sans text-gray-600">
                {formData.city}, {formData.state}
              </span>
            </div>
          )}
        </div>
      </div>

      <AuthActionButtons
        secondaryLabel="Previous"
        primaryLabel="Complete Registration"
        onSecondaryClick={onBack}
        secondaryDisabled={isLoading}
        primaryLoading={isLoading}
        containerClassName="pt-4"
        secondaryIcon={<ArrowLeft className="mr-2 h-4 w-4" />}
        primaryIcon={<CheckCircle2 className="ml-2 h-4 w-4" />}
        secondaryClassName="h-12 border-gray-300"
        primaryClassName="h-12"
      />
    </form>
  );
}
