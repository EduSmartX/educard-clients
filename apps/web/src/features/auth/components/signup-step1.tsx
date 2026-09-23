import { ArrowLeft, ArrowRight, Mail, Building2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FormPlaceholders } from '@/constants';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AuthActionButtons } from './auth-action-buttons';
import type { Step1Data } from '../utils/signup.schemas';

interface SignupStep1Props {
  form: UseFormReturn<Step1Data>;
  useSameEmail: boolean;
  setUseSameEmail: (v: boolean) => void;
  isLoading: boolean;
  onSubmit: (data: Step1Data) => void;
  onNavigateLogin: () => void;
}

export function SignupStep1({
  form,
  useSameEmail,
  setUseSameEmail,
  isLoading,
  onSubmit,
  onNavigateLogin,
}: SignupStep1Props) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Section Header with Icon */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-3">
          <Mail className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Email Verification</h3>
          <p className="text-sm text-gray-500">We'll verify these aren't already registered</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 rounded-xl border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <span className="text-lg text-blue-600">💡</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-blue-800">
          We'll send verification codes to confirm these emails aren't already in use.
        </p>
      </div>

      {/* Admin Email */}
      <div className="space-y-2">
        <Label
          htmlFor="adminEmail"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
            1
          </span>
          <span>Administrator Email</span>
          <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="adminEmail"
            type="email"
            placeholder={FormPlaceholders.ADMIN_EMAIL_EXAMPLE}
            className={cn(
              'h-14 w-full rounded-xl border-2 border-gray-200 pl-12 text-base transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-50',
              form.formState.errors.adminEmail &&
                'border-red-500 focus:border-red-500 focus:ring-red-50'
            )}
            {...form.register('adminEmail')}
          />
        </div>
        {form.formState.errors.adminEmail && (
          <p className="ml-1 flex items-center gap-1.5 text-sm font-medium text-red-600">
            <span className="inline-block">⚠️</span>
            {form.formState.errors.adminEmail.message}
          </p>
        )}
        <p className="ml-1 flex items-center gap-1 text-xs text-gray-500">
          <span className="inline-block h-1 w-1 rounded-full bg-gray-400"></span>
          <span>Your personal admin account email</span>
        </p>
      </div>

      {/* Organization Email */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="orgEmail"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
              2
            </span>
            <span>Organization Email</span>
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Switch
              id="useSameEmail"
              checked={useSameEmail}
              onCheckedChange={(checked: boolean) => {
                setUseSameEmail(checked);
                if (checked) {
                  const adminEmail = form.getValues('adminEmail');
                  if (adminEmail) {
                    form.setValue('orgEmail', adminEmail, { shouldValidate: true });
                  }
                  form.clearErrors('orgEmail');
                } else {
                  form.setValue('orgEmail', '');
                }
              }}
            />
            <Label
              htmlFor="useSameEmail"
              className="cursor-pointer text-xs font-medium text-gray-600"
            >
              Same as admin
            </Label>
          </div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="orgEmail"
            type="email"
            placeholder={FormPlaceholders.SCHOOL_EMAIL_EXAMPLE}
            className={cn(
              'h-14 w-full rounded-xl border-2 pl-12 text-base transition-all',
              useSameEmail
                ? 'border-purple-200 bg-purple-50/50 text-gray-500'
                : 'border-gray-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50',
              form.formState.errors.orgEmail &&
                !useSameEmail &&
                'border-red-500 focus:border-red-500 focus:ring-red-50'
            )}
            disabled={useSameEmail}
            {...form.register('orgEmail')}
          />
        </div>
        {form.formState.errors.orgEmail && !useSameEmail && (
          <p className="ml-1 flex items-center gap-1.5 text-sm font-medium text-red-600">
            <span className="inline-block">⚠️</span>
            {form.formState.errors.orgEmail.message}
          </p>
        )}
        <p className="ml-1 flex items-center gap-1 text-xs text-gray-500">
          <span className="inline-block h-1 w-1 rounded-full bg-gray-400"></span>
          {useSameEmail
            ? 'Using same email as administrator'
            : 'Official organization email for communication'}
        </p>
      </div>

      <AuthActionButtons
        secondaryLabel="Back to Login"
        primaryLabel="Send Verification Codes"
        onSecondaryClick={onNavigateLogin}
        primaryLoading={isLoading}
        secondaryIcon={<ArrowLeft className="mr-2 h-5 w-5" />}
        primaryIcon={<ArrowRight className="ml-2 h-5 w-5" />}
      />
    </form>
  );
}
