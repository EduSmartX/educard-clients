/**
 * AddressForm - Reusable Address Form Component
 *
 * Fields cascade from the broadest value to the narrowest (Country -> State ->
 * City -> Street), so the country decides how State and City are captured: for
 * India they become searchable pickers backed by the bundled state/district
 * data, everywhere else they stay free text.
 */

import {
  Colors,
  COUNTRY_OPTIONS,
  INDIA_COUNTRY_NAME,
  INDIA_STATE_NAMES,
  getIndiaDistricts,
  isIndia,
} from '@educard/shared';
import {
  MapPin,
  Home,
  Building2,
  MapPinned,
  Hash,
  Globe,
  ChevronDown,
  ChevronUp,
  Crosshair,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  fetchCurrentAddress,
  isLocationLookupEnabled,
  LOCATION_PERMISSION_DENIED,
  type ResolvedAddress,
} from '@/lib/location';

// Address data structure
export interface AddressData {
  streetAddress: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Error structure for validation
export interface AddressErrors {
  streetAddress?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface AddressFormProps {
  values: AddressData;
  onChange: (field: keyof AddressData, value: string) => void;
  errors?: AddressErrors;
  required?: boolean;
  showHeader?: boolean;
  compact?: boolean;
  disabled?: boolean;
  /** Renders an "Address (Optional)" row that expands and collapses the fields. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const toOptions = (choices: readonly string[]) =>
  choices.map(choice => ({ value: choice, label: choice }));

/** Google's spelling only fills a picker if it matches an option exactly. */
const matchOption = (choices: readonly string[], value: string) =>
  choices.find(choice => choice.toLowerCase() === value.trim().toLowerCase()) ??
  '';

export function AddressForm({
  values,
  onChange,
  errors = {},
  required = false,
  showHeader = true,
  compact: _compact = false,
  disabled = false,
  collapsible = false,
  defaultExpanded = false,
}: AddressFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const countryIsIndia = isIndia(values.country ?? '');
  const districts = countryIsIndia ? getIndiaDistricts(values.state ?? '') : [];

  const iconColor = (field: keyof AddressData) =>
    focusedField === field ? Colors.primary[500] : Colors.gray[400];

  const renderLabel = (label: string, optional: boolean) => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required && !optional && <Text style={styles.required}> *</Text>}
      </Text>
      {optional && <Text style={styles.optionalTag}>Optional</Text>}
    </View>
  );

  const renderTextField = (
    field: keyof AddressData,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    options?: {
      optional?: boolean;
      keyboardType?: 'default' | 'numeric' | 'email-address';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      maxLength?: number;
    },
  ) => {
    const isFocused = focusedField === field;
    const hasError = !!errors[field];

    return (
      <View style={styles.fieldContainer}>
        {renderLabel(label, options?.optional ?? false)}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            hasError && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
          <View style={[styles.iconContainer, isFocused && styles.iconFocused]}>
            {icon}
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.gray[400]}
            value={values[field] ?? ''}
            onChangeText={text => onChange(field, text)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            editable={!disabled}
            keyboardType={options?.keyboardType ?? 'default'}
            autoCapitalize={options?.autoCapitalize ?? 'words'}
            maxLength={options?.maxLength}
          />
        </View>
        {hasError && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  const renderSelectField = (
    field: keyof AddressData,
    label: string,
    choices: readonly string[],
    placeholder: string,
    onSelect: (value: string) => void,
    isDisabled = false,
  ) => (
    <View style={styles.fieldContainer}>
      {renderLabel(label, false)}
      <SearchableSelect
        options={toOptions(choices)}
        value={values[field] ?? ''}
        onValueChange={onSelect}
        title={label}
        placeholder={placeholder}
        searchPlaceholder={`Search ${label.toLowerCase()}...`}
        disabled={disabled || isDisabled}
      />
      {!!errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  // Narrower values stop matching once a broader one changes.
  const handleCountryChange = (country: string) => {
    onChange('country', country);
    onChange('state', '');
    onChange('city', '');
  };

  const handleStateChange = (state: string) => {
    onChange('state', state);
    onChange('city', '');
  };

  const applyResolvedAddress = (resolved: ResolvedAddress) => {
    const country = isIndia(resolved.country)
      ? INDIA_COUNTRY_NAME
      : resolved.country;
    onChange('country', country);

    if (isIndia(country)) {
      const state = matchOption(INDIA_STATE_NAMES, resolved.state);
      onChange('state', state);
      onChange(
        'city',
        state ? matchOption(getIndiaDistricts(state), resolved.city) : '',
      );
    } else {
      onChange('state', resolved.state);
      onChange('city', resolved.city);
    }

    onChange('streetAddress', resolved.streetAddress);
    onChange('zipCode', resolved.zipCode);
    // No backend column for mandal yet, so it lands in the free-text area line.
    if (resolved.mandal) {
      onChange('addressLine2', resolved.mandal);
    }
  };

  const handleUseLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      applyResolvedAddress(await fetchCurrentAddress());
      setExpanded(true);
    } catch (error) {
      // Autofill is a convenience: surface a hint and leave the fields editable.
      const denied =
        error instanceof Error && error.message === LOCATION_PERMISSION_DENIED;
      setLocationError(
        denied
          ? 'Location permission denied. Please enter the address manually.'
          : 'Could not detect your location. Please enter the address manually.',
      );
      setExpanded(true);
    } finally {
      setLocating(false);
    }
  };

  const locationButton = isLocationLookupEnabled ? (
    <View>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => {
          handleUseLocation();
        }}
        disabled={disabled || locating}
        activeOpacity={0.7}
      >
        {locating ? (
          <ActivityIndicator size="small" color={Colors.primary[600]} />
        ) : (
          <Crosshair size={16} color={Colors.primary[600]} />
        )}
        <Text style={styles.locationButtonText}>
          {locating ? 'Finding your address...' : 'Use my location'}
        </Text>
      </TouchableOpacity>
      {!!locationError && <Text style={styles.errorText}>{locationError}</Text>}
    </View>
  ) : null;

  const fields = (
    <View style={styles.fieldsContainer}>
      {locationButton}
      {renderSelectField(
        'country',
        'Country',
        COUNTRY_OPTIONS,
        'Select country',
        handleCountryChange,
      )}

      {countryIsIndia
        ? renderSelectField(
            'state',
            'State',
            INDIA_STATE_NAMES,
            'Select state',
            handleStateChange,
          )
        : renderTextField(
            'state',
            'State',
            'State',
            <MapPin size={18} color={iconColor('state')} />,
            { autoCapitalize: 'words' },
          )}

      {countryIsIndia
        ? renderSelectField(
            'city',
            'City / District',
            districts,
            values.state ? 'Select district' : 'Select a state first',
            value => onChange('city', value),
            !values.state,
          )
        : renderTextField(
            'city',
            'City',
            'City',
            <MapPinned size={18} color={iconColor('city')} />,
            { autoCapitalize: 'words' },
          )}

      {renderTextField(
        'streetAddress',
        'Street Address',
        '123 Main Street',
        <Home size={18} color={iconColor('streetAddress')} />,
        { autoCapitalize: 'words' },
      )}

      {renderTextField(
        'addressLine2',
        countryIsIndia ? 'Area / Mandal' : 'Address Line 2',
        countryIsIndia
          ? 'Area, Mandal or Landmark'
          : 'Apartment, Suite, Building',
        <Building2 size={18} color={iconColor('addressLine2')} />,
        { optional: true, autoCapitalize: 'words' },
      )}

      {renderTextField(
        'zipCode',
        'PIN Code',
        '123456',
        <Hash size={18} color={iconColor('zipCode')} />,
        { keyboardType: 'numeric', maxLength: countryIsIndia ? 6 : 10 },
      )}
    </View>
  );

  if (collapsible) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.collapseHeader}
          onPress={() => setExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.collapseTitle}>
            Address <Text style={styles.collapseOptional}>(Optional)</Text>
          </Text>
          {expanded ? (
            <ChevronUp size={20} color={Colors.gray[500]} />
          ) : (
            <ChevronDown size={20} color={Colors.gray[500]} />
          )}
        </TouchableOpacity>
        {expanded && fields}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Globe size={20} color={Colors.gray[500]} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Address Information</Text>
              <Text style={styles.headerSubtitle}>
                {required
                  ? 'Complete address required'
                  : 'Optional address details'}
              </Text>
            </View>
          </View>
        </View>
      )}
      {fields}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapseTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
    letterSpacing: 0.1,
  },
  collapseOptional: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.gray[400],
  },
  fieldsContainer: {
    gap: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    backgroundColor: Colors.primary[50],
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  fieldContainer: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[700],
    letterSpacing: 0.1,
  },
  required: {
    color: '#ef4444',
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.gray[400],
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    paddingHorizontal: 12,
    minHeight: 50,
    gap: 10,
  },
  inputFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputDisabled: {
    backgroundColor: Colors.gray[100],
    opacity: 0.7,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    backgroundColor: Colors.primary[50],
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[900],
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
  },
});

export default AddressForm;
