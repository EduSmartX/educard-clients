import { ArrowLeft, CheckCircle2, User } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FormPlaceholders } from '@/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PhoneInput } from '@/components/form/phone-input';
import { AuthActionButtons } from './auth-action-buttons';
import type { Step4Data } from '../utils/signup.schemas';

interface SignupStep4Props {
  form: UseFormReturn<Step4Data>;
  formData: {
    orgName?: string;
    orgEmail?: string;
    adminEmail?: string;
    city?: string;
    state?: string;
  };
  isLoading: boolean;
  onSubmit: (data: Step4Data) => void;
  onBack: () => void;
}

export function SignupStep4({ form, formData, isLoading, onSubmit, onBack }: SignupStep4Props) {
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
            className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            error={form.formState.errors.phoneNumber?.message}
            {...form.register('phoneNumber')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
            Gender
          </Label>
          <SearchableSelect
            options={[
              { value: 'M', label: 'Male' },
              { value: 'F', label: 'Female' },
              { value: 'O', label: 'Other' },
            ]}
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
