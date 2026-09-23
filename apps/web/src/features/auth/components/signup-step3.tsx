import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FormPlaceholders } from '@/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddressForm } from '@/components/form/address-form';
import { PhoneInput } from '@/components/form/phone-input';
import { ORGANIZATION_TYPES, BOARD_AFFILIATIONS } from '@educard/shared';
import { AuthActionButtons } from './auth-action-buttons';
import type { Step3Data } from '../utils/signup.schemas';

interface SignupStep3Props {
  form: UseFormReturn<Step3Data>;
  includeAddress: boolean;
  setIncludeAddress: (v: boolean) => void;
  isAddressExiting: boolean;
  setIsAddressExiting: (v: boolean) => void;
  onSubmit: (data: Step3Data) => void;
  onBack: () => void;
}

export function SignupStep3({
  form,
  includeAddress,
  setIncludeAddress,
  isAddressExiting,
  setIsAddressExiting,
  onSubmit,
  onBack,
}: SignupStep3Props) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-3">
          <Building2 className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Organization Information</h3>
          <p className="text-sm text-gray-500">Tell us about your institution</p>
        </div>
      </div>

      {/* Organization Name */}
      <div className="space-y-2">
        <Label
          htmlFor="orgName"
          className="flex items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
            🏢
          </span>
          <span>Organization Name</span>
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="orgName"
          placeholder={FormPlaceholders.ENTER_SCHOOL_NAME}
          className="h-14 rounded-xl border-2 border-gray-200 text-base transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-50"
          error={form.formState.errors.orgName?.message}
          {...form.register('orgName')}
        />
      </div>

      {/* Organization Type & Phone */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="orgType"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
              📚
            </span>
            <span>Organization Type</span>
            <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            options={ORGANIZATION_TYPES.map((type) => ({ value: type.value, label: type.label }))}
            value={form.watch('orgType')}
            onValueChange={(value: string) =>
              form.setValue('orgType', value, { shouldValidate: true })
            }
            placeholder={FormPlaceholders.SELECT_OPTION}
            className="h-14 text-base"
          />
          {form.formState.errors.orgType?.message && (
            <p className="text-sm text-red-600">
              {form.formState.errors.orgType.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="orgPhone"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
              📞
            </span>
            <span>Phone Number</span>
            <span className="text-red-500">*</span>
          </Label>
          <PhoneInput
            id="orgPhone"
            value={form.watch('orgPhone')}
            onChange={(value: string) =>
              form.setValue('orgPhone', value, { shouldValidate: false })
            }
            error={form.formState.errors.orgPhone?.message as string}
            required={false}
            compact={false}
          />
        </div>
      </div>

      {/* Website & Board Affiliation */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="orgWebsite"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              🌐
            </span>
            <span>Website</span>
            <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </Label>
          <Input
            id="orgWebsite"
            type="url"
            placeholder={FormPlaceholders.WEBSITE_GENERIC_EXAMPLE}
            className="h-14 rounded-xl border-2 border-gray-200 text-base transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            {...form.register('orgWebsite')}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="boardAffiliation"
            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              🎓
            </span>
            <span>Board Affiliation</span>
            <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </Label>
          <SearchableSelect
            options={BOARD_AFFILIATIONS.map((board) => ({
              value: board.value,
              label: board.label,
            }))}
            value={form.watch('boardAffiliation') || ''}
            onValueChange={(value: string) =>
              form.setValue('boardAffiliation', value, { shouldValidate: true })
            }
            placeholder={FormPlaceholders.SELECT_OPTION}
            className="h-14 text-base"
          />
        </div>
      </div>

      {/* Address Toggle */}
      <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <span className="text-xl text-amber-600">📍</span>
            </div>
            <div>
              <Label
                htmlFor="includeAddress"
                className="cursor-pointer text-sm font-bold text-gray-800"
              >
                Add Address Information
              </Label>
              <p className="mt-0.5 text-xs text-gray-600">
                Include your organization's physical address (optional)
              </p>
            </div>
          </div>
          <Switch
            id="includeAddress"
            checked={includeAddress}
            onCheckedChange={(checked: boolean) => {
              if (!checked) {
                setIsAddressExiting(true);
                setTimeout(() => {
                  setIncludeAddress(false);
                  setIsAddressExiting(false);
                  form.setValue('streetAddress', '');
                  form.setValue('addressLine2', '');
                  form.setValue('city', '');
                  form.setValue('state', '');
                  form.setValue('zipCode', '');
                  form.clearErrors(['streetAddress', 'city', 'state', 'zipCode']);
                }, 300);
              } else {
                setIncludeAddress(true);
              }
            }}
          />
        </div>
      </div>

      {/* Address Fields */}
      {(includeAddress || isAddressExiting) && (
        <div
          className={`origin-top overflow-hidden pt-2 ${
            isAddressExiting ? 'address-form-exit' : 'address-form-enter'
          }`}
        >
          <AddressForm
            form={form}
            required={includeAddress}
            showHeader={false}
            compact={false}
            showLocationButton={true}
          />
        </div>
      )}

      <AuthActionButtons
        secondaryLabel="Previous"
        primaryLabel="Continue"
        onSecondaryClick={onBack}
        secondaryIcon={<ArrowLeft className="mr-2 h-5 w-5" />}
        primaryIcon={<ArrowRight className="ml-2 h-5 w-5" />}
      />
    </form>
  );
}
