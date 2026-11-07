import {
  COUNTRY_OPTIONS,
  INDIA_COUNTRY_NAME,
  INDIA_STATE_NAMES,
  getIndiaDistricts,
  isIndia,
} from '@educard/shared';
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

/**
 * Picker options, keeping a saved value that is not in the bundled list (older
 * free-text records such as "Bengaluru") so editing never silently blanks it.
 */
const toOptions = (choices: readonly string[], current = '') =>
  (current && !choices.includes(current) ? [current, ...choices] : choices).map((choice) => ({
    value: choice,
    label: choice,
  }));

/** Google's spelling only fills a picker if it matches an option exactly. */
const matchOption = (choices: readonly string[], value: string) =>
  choices.find((choice) => choice.toLowerCase() === value.trim().toLowerCase()) ?? '';

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

  const country: string = form.watch(getFieldName('country')) || '';
  const state: string = form.watch(getFieldName('state')) || '';
  const city: string = form.watch(getFieldName('city')) || '';
  const countryIsIndia = isIndia(country);

  const fieldError = (field: keyof FieldNames) =>
    form.formState.errors[getFieldName(field)]?.message as string | undefined;

  const setField = (field: keyof FieldNames, value: string) =>
    form.setValue(getFieldName(field), value, { shouldValidate: true, shouldDirty: true });

  // Narrower values stop matching once a broader one changes.
  const handleCountryChange = (value: string) => {
    setField('country', value);
    setField('state', '');
    setField('city', '');
  };

  const handleStateChange = (value: string) => {
    setField('state', value);
    setField('city', '');
  };

  // Only offer "Use My Location" when a real Google Maps API key is configured.
  // Without it, the form simply renders as a normal manual-entry address form.
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const canUseLocation = showLocationButton && Boolean(googleMapsApiKey);

  // Handle "Use My Location" button click
  const handleUseLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const locationData = await getCurrentLocationAddress(googleMapsApiKey);

      // Fill form fields with location data using mapped field names
      form.setValue(getFieldName('streetAddress'), locationData.streetAddress, {
        shouldValidate: true,
      });
      form.setValue(getFieldName('zipCode'), locationData.zipCode, { shouldValidate: true });
      if (isIndia(locationData.country)) {
        // Google's spelling only fills a picker if it matches an option exactly.
        const matchedState = matchOption(INDIA_STATE_NAMES, locationData.state);
        setField('country', INDIA_COUNTRY_NAME);
        setField('state', matchedState);
        setField(
          'city',
          matchedState ? matchOption(getIndiaDistricts(matchedState), locationData.city) : ''
        );
      } else {
        setField('country', locationData.country);
        setField('state', locationData.state);
        setField('city', locationData.city);
      }

      toast.success(SuccessMessages.LOCATION.AUTO_FILLED);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : ErrorMessages.LOCATION_UNAVAILABLE;
      toast.error(errorMessage);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const useLocationButton = (
    <Button
      type="button"
      onClick={handleUseLocation}
      disabled={isLoadingLocation || disabled}
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
  );

  return (
    <div className="space-y-4">
      {/* Section Header and/or Location Button */}
      {(showHeader || canUseLocation) && (
        <div
          className={cn('mb-4 flex items-center', showHeader ? 'justify-between' : 'justify-end')}
        >
          {showHeader && (
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
          )}

          {/* Use My Location Button */}
          {canUseLocation && useLocationButton}
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

      {/* Country -> State -> City cascade (same order as the mobile app). India
          uses searchable pickers from the bundled state/district data; any other
          country falls back to free text, since we have no reference data for it. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={getFieldName('country')} className={labelSize}>
            Country
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          <SearchableSelect
            options={toOptions(COUNTRY_OPTIONS, country)}
            value={country}
            onValueChange={handleCountryChange}
            placeholder="Select country"
            searchPlaceholder="Search country..."
            className="bg-gray-50 focus:bg-white"
            disabled={disabled}
          />
          {fieldError('country') && <p className="text-sm text-red-600">{fieldError('country')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor={getFieldName('state')} className={labelSize}>
            State
            {required && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {countryIsIndia ? (
            <>
              <SearchableSelect
                options={toOptions(INDIA_STATE_NAMES, state)}
                value={state}
                onValueChange={handleStateChange}
                placeholder="Select state"
                searchPlaceholder="Search state..."
                className="bg-gray-50 focus:bg-white"
                disabled={disabled}
              />
              {fieldError('state') && <p className="text-sm text-red-600">{fieldError('state')}</p>}
            </>
          ) : (
            <Input
              id={getFieldName('state')}
              placeholder="State"
              disabled={disabled}
              className="bg-gray-50 focus:bg-white"
              error={fieldError('state')}
              {...form.register(getFieldName('state'))}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={getFieldName('city')} className={labelSize}>
          {countryIsIndia ? 'City / District' : 'City'}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {countryIsIndia ? (
          <>
            <SearchableSelect
              options={toOptions(getIndiaDistricts(state), city)}
              value={city}
              onValueChange={(value: string) => setField('city', value)}
              placeholder={state ? 'Select district' : 'Select a state first'}
              searchPlaceholder="Search district..."
              className="bg-gray-50 focus:bg-white"
              disabled={disabled || !state}
            />
            {fieldError('city') && <p className="text-sm text-red-600">{fieldError('city')}</p>}
          </>
        ) : (
          <Input
            id={getFieldName('city')}
            placeholder="City"
            disabled={disabled}
            className="bg-gray-50 focus:bg-white"
            error={fieldError('city')}
            {...form.register(getFieldName('city'))}
          />
        )}
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label
          htmlFor={getFieldName('streetAddress')}
          className={`${labelSize} flex items-center gap-2`}
        >
          Street Address{required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={getFieldName('streetAddress')}
          placeholder="123 Main Street"
          disabled={disabled}
          className="bg-gray-50 focus:bg-white"
          error={fieldError('streetAddress')}
          {...form.register(getFieldName('streetAddress'))}
        />
      </div>

      {/* Address Line 2 */}
      <div className="space-y-2">
        <Label htmlFor={getFieldName('addressLine2')} className={labelSize}>
          <span className="text-sm font-normal text-gray-500">
            {countryIsIndia ? 'Area / Mandal (Optional)' : 'Address Line 2 (Optional)'}
          </span>
        </Label>
        <Input
          id={getFieldName('addressLine2')}
          placeholder={countryIsIndia ? 'Area, Mandal or Landmark' : 'Apartment, Suite, Building'}
          disabled={disabled}
          className="bg-gray-50 focus:bg-white"
          {...form.register(getFieldName('addressLine2'))}
        />
      </div>

      {/* PIN / ZIP Code */}
      <div className="space-y-2">
        <Label htmlFor={getFieldName('zipCode')} className={labelSize}>
          {countryIsIndia ? 'PIN Code' : 'ZIP / Postal Code'}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        <Input
          id={getFieldName('zipCode')}
          placeholder={countryIsIndia ? '123456' : '12345'}
          inputMode="numeric"
          maxLength={countryIsIndia ? 6 : 10}
          disabled={disabled}
          className="bg-gray-50 focus:bg-white md:max-w-xs"
          error={fieldError('zipCode')}
          {...form.register(getFieldName('zipCode'))}
        />
      </div>
    </div>
  );
}
