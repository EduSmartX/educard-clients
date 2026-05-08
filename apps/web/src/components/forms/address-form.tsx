import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCurrentLocationAddress } from '@/lib/location-utils';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ADDRESS_TYPE_OPTIONS } from '@/constants';
import { CommonUiText, ErrorMessages, FormPlaceholders, SuccessMessages } from '@/constants';

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
  form: any; // UseFormReturn from react-hook-form
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">📍</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-800">Address Information</h4>
              <p className="text-xs text-gray-600 mt-0.5">
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
                'flex items-center gap-2 h-9 px-3 border-2 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all text-xs font-medium',
                isLoadingLocation && 'opacity-50 cursor-not-allowed'
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
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select
            value={form.watch(getFieldName('addressType'))}
            onValueChange={(value) => form.setValue(getFieldName('addressType'), value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-gray-50 focus:bg-white">
              <SelectValue placeholder={FormPlaceholders.SELECT_ADDRESS_TYPE} />
            </SelectTrigger>
            <SelectContent>
              {ADDRESS_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <span className="text-sm text-gray-500 font-normal">Address Line 2 (Optional)</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={getFieldName('city')} className={labelSize}>
            City
            {required && <span className="text-red-500 ml-1">*</span>}
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
            {required && <span className="text-red-500 ml-1">*</span>}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={getFieldName('zipCode')} className={labelSize}>
            ZIP Code
            {required && <span className="text-red-500 ml-1">*</span>}
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
