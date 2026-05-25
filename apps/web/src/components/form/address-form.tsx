import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn } from '@/lib/utils';
import { getCurrentLocationAddress } from '@/lib/location-utils';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ADDRESS_TYPE_OPTIONS, CommonUiText, ErrorMessages, SuccessMessages } from '@/constants';

interface FieldNames {
  addressType?: string;
  streetAddress?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface AddressFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  required?: boolean;
  fieldPrefix?: string; // For nested form fields like 'address.city'
  showHeader?: boolean;
  compact?: boolean; // For smaller layouts
  showLocationButton?: boolean; // Show "Use My Location" button
  showAddressType?: boolean; // Show address type dropdown
  fieldNames?: FieldNames; // Custom field names (for snake_case compatibility)
  disabled?: boolean; // Disable all fields
}

export function AddressForm({
  form,
  required = false,
  fieldPrefix = '',
  showHeader = true,
  compact = false,
  showLocationButton = true,
  showAddressType = true,
  fieldNames,
  disabled = false,
}: AddressFormProps) {
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);

  // Default field names (camelCase)
  const defaultFieldNames: Required<FieldNames> = {
    addressType: 'addressType',
    streetAddress: 'streetAddress',
    addressLine2: 'addressLine2',
    city: 'city',
    state: 'state',
    zipCode: 'zipCode',
    country: 'country',
  };

  // Merge custom field names with defaults
  const fields = { ...defaultFieldNames, ...fieldNames };

  const getFieldName = (field: keyof FieldNames) => {
    const fieldName = fields[field];
    return fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
  };

  const labelSize = compact ? 'text-xs' : 'text-sm';

  // Handle "Use My Location" button click
  const handleUseLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const locationData = await getCurrentLocationAddress(apiKey);

      // Fill form fields with location data using mapped field names
      form.setValue(getFieldName('streetAddress'), locationData.streetAddress, {
        shouldValidate: true,
      });
      form.setValue(getFieldName('city'), locationData.city, { shouldValidate: true });
      form.setValue(getFieldName('state'), locationData.state, { shouldValidate: true });
      form.setValue(getFieldName('zipCode'), locationData.zipCode, { shouldValidate: true });
      form.setValue(getFieldName('country'), locationData.country, { shouldValidate: true });

      toast.success(SuccessMessages.LOCATION.AUTO_FILLED);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ErrorMessages.LOCATION_UNAVAILABLE;
      toast.error(errorMessage);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header with Location Button */}
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <span className="text-xl text-green-600">📍</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-800">Address Information</h4>
              <p className="mt-0.5 text-xs text-gray-600">
                {required ? 'Provide complete address details' : 'Optional address details'}
              </p>
            </div>
          </div>

          {/* Use My Location Button */}
          {showLocationButton && (
            <Button
              type="button"
              onClick={handleUseLocation}
              disabled={isLoadingLocation}
              className={cn(
                'flex h-9 items-center gap-2 rounded-lg border-2 border-blue-200 bg-white px-3 text-xs font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-50',
                isLoadingLocation && 'cursor-not-allowed opacity-50'
              )}
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {CommonUiText.GETTING_LOCATION}
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Use My Location
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Address Type Dropdown */}
      {showAddressType && (
        <div className="space-y-2">
          <Label htmlFor={getFieldName('addressType')} className={labelSize}>
            Address Type
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <SearchableSelect
            options={ADDRESS_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={form.watch(getFieldName('addressType')) || ''}
            onValueChange={(value: string) => form.setValue(getFieldName('addressType'), value)}
            placeholder="Select address type"
            className="bg-gray-50 focus:bg-white"
            disabled={disabled}
          />
          {form.formState.errors[getFieldName('addressType')]?.message && (
            <p className="text-sm text-red-600">
              {form.formState.errors[getFieldName('addressType')]?.message as string}
            </p>
          )}
        </div>
      )}

      {/* Street Address */}
      <div className="space-y-2">
        <Label
          htmlFor={getFieldName('streetAddress')}
          className={`${labelSize} flex items-center gap-2`}
        >
          Address Line 1{required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={getFieldName('streetAddress')}
          placeholder="123 Main Street"
          disabled={disabled}
          className="bg-gray-50 focus:bg-white"
          error={form.formState.errors[getFieldName('streetAddress')]?.message as string}
          {...form.register(getFieldName('streetAddress'))}
        />
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor={getFieldName('addressLine2')} className={labelSize}>
          <span className="text-sm font-normal text-gray-500">Address Line 2 (Optional)</span>
        </Label>
        <Input
          id={getFieldName('addressLine2')}
          placeholder="Suite, Building, Floor"
          disabled={disabled}
          className="bg-gray-50 focus:bg-white"
          {...form.register(getFieldName('addressLine2'))}
        />
      </div>

      {/* City & State */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={getFieldName('city')} className={labelSize}>
            City
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Input
            id={getFieldName('city')}
            placeholder="City"
            disabled={disabled}
            className="bg-gray-50 focus:bg-white"
            error={form.formState.errors[getFieldName('city')]?.message as string}
            {...form.register(getFieldName('city'))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={getFieldName('state')} className={labelSize}>
            State
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Input
            id={getFieldName('state')}
            placeholder="State"
            disabled={disabled}
            className="bg-gray-50 focus:bg-white"
            error={form.formState.errors[getFieldName('state')]?.message as string}
            {...form.register(getFieldName('state'))}
          />
        </div>
      </div>

      {/* ZIP Code & Country */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={getFieldName('zipCode')} className={labelSize}>
            ZIP Code
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <Input
            id={getFieldName('zipCode')}
            placeholder="12345"
            disabled={disabled}
            className="bg-gray-50 focus:bg-white"
            error={form.formState.errors[getFieldName('zipCode')]?.message as string}
            {...form.register(getFieldName('zipCode'))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={getFieldName('country')} className={labelSize}>
            Country
          </Label>
          <Input
            id={getFieldName('country')}
            defaultValue="India"
            disabled={disabled}
            className="bg-gray-50 focus:bg-white"
            {...form.register(getFieldName('country'))}
          />
        </div>
      </div>
    </div>
  );
}
