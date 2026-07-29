/**
 * AddressForm - Reusable Address Form Component
 *
 * A modern, field-level address form component for React Native.
 * Supports:
 * - Individual address fields (Street, City, State, ZIP, Country)
 * - Optional address line 2
 * - Location auto-fill (when permissions granted)
 * - Compact and full modes
 * - Customizable field names for API compatibility
 * - Validation error display
 *
 * Usage:
 * <AddressForm
 *   values={addressValues}
 *   onChange={handleAddressChange}
 *   errors={addressErrors}
 *   required={false}
 * />
 */

import { Colors } from '@educard/shared';
import * as Location from 'expo-location';
import { MapPin, Navigation, Home, Building2, MapPinned, Hash, Globe } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';

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
  showLocationButton?: boolean;
  compact?: boolean;
  disabled?: boolean;
  onLocationFetched?: (address: Partial<AddressData>) => void;
}

export function AddressForm({
  values,
  onChange,
  errors = {},
  required = false,
  showHeader = true,
  showLocationButton = true,
  compact: _compact = false,
  disabled = false,
  onLocationFetched,
}: AddressFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { width } = useResponsive();
  const useTwoColumnRows = width >= 400;

  // Handle location auto-fill
  const handleUseLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result) {
        const addressData: Partial<AddressData> = {
          streetAddress: [result.streetNumber, result.street].filter(Boolean).join(' ') ?? '',
          city: result.city ?? result.subregion ?? '',
          state: result.region ?? '',
          zipCode: result.postalCode ?? '',
          country: result.country ?? 'India',
        };

        // Update all fields
        Object.entries(addressData).forEach(([key, value]) => {
          if (value) {
            onChange(key as keyof AddressData, value);
          }
        });

        onLocationFetched?.(addressData);
      }
    } catch {
      // Location fetch failed silently
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Render individual input field
  const renderField = (
    field: keyof AddressData,
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    options?: {
      optional?: boolean;
      keyboardType?: 'default' | 'numeric' | 'email-address';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      halfWidth?: boolean;
    }
  ) => {
    const isFocused = focusedField === field;
    const hasError = !!errors[field];
    const isOptional = options?.optional ?? false;

    return (
      <View style={[styles.fieldContainer, options?.halfWidth && styles.halfWidth]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required && !isOptional && <Text style={styles.required}> *</Text>}
          </Text>
          {isOptional && <Text style={styles.optionalTag}>Optional</Text>}
        </View>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            hasError && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
        >
          <View style={[styles.iconContainer, isFocused && styles.iconFocused]}>{icon}</View>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.gray[400]}
            value={values[field] ?? ''}
            onChangeText={(text) => onChange(field, text)}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            editable={!disabled}
            keyboardType={options?.keyboardType ?? 'default'}
            autoCapitalize={options?.autoCapitalize ?? 'words'}
          />
        </View>
        {hasError && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <MapPin size={20} color={Colors.success[600]} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Address Information</Text>
              <Text style={styles.headerSubtitle}>
                {required ? 'Complete address required' : 'Optional address details'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Use Location Button - Below Header */}
      {showLocationButton && (
        <TouchableOpacity
          style={[styles.useLocationButton, isLoadingLocation && styles.locationButtonLoading]}
          onPress={() => void handleUseLocation()}
          disabled={isLoadingLocation || disabled}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary[600]} />
          ) : (
            <Navigation size={16} color={Colors.primary[600]} />
          )}
          <Text style={styles.useLocationButtonText}>
            {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Form Fields */}
      <View style={styles.fieldsContainer}>
        {/* Street Address */}
        {renderField(
          'streetAddress',
          'Street Address',
          '123 Main Street',
          <Home
            size={18}
            color={focusedField === 'streetAddress' ? Colors.primary[500] : Colors.gray[400]}
          />,
          { autoCapitalize: 'words' }
        )}

        {/* Address Line 2 */}
        {renderField(
          'addressLine2',
          'Address Line 2',
          'Apartment, Suite, Building',
          <Building2
            size={18}
            color={focusedField === 'addressLine2' ? Colors.primary[500] : Colors.gray[400]}
          />,
          { optional: true, autoCapitalize: 'words' }
        )}

        {/* City & State Row */}
        <View style={[styles.row, !useTwoColumnRows && styles.rowStacked]}>
          {renderField(
            'city',
            'City',
            'City',
            <MapPinned
              size={18}
              color={focusedField === 'city' ? Colors.primary[500] : Colors.gray[400]}
            />,
            { halfWidth: true, autoCapitalize: 'words' }
          )}
          {renderField(
            'state',
            'State',
            'State',
            <MapPin
              size={18}
              color={focusedField === 'state' ? Colors.primary[500] : Colors.gray[400]}
            />,
            { halfWidth: true, autoCapitalize: 'words' }
          )}
        </View>

        {/* ZIP Code & Country Row */}
        <View style={[styles.row, !useTwoColumnRows && styles.rowStacked]}>
          {renderField(
            'zipCode',
            'PIN Code',
            '123456',
            <Hash
              size={18}
              color={focusedField === 'zipCode' ? Colors.primary[500] : Colors.gray[400]}
            />,
            { halfWidth: true, keyboardType: 'numeric' }
          )}
          {renderField(
            'country',
            'Country',
            'India',
            <Globe
              size={18}
              color={focusedField === 'country' ? Colors.primary[500] : Colors.gray[400]}
            />,
            { halfWidth: true, autoCapitalize: 'words' }
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.success[50],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.success[100],
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
    backgroundColor: Colors.success[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
  },
  locationButtonLoading: {
    opacity: 0.7,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[600],
  },

  // Use Location Button - Standalone
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary[200],
    borderStyle: 'dashed',
  },
  useLocationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[600],
  },

  // Fields container
  fieldsContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowStacked: {
    flexDirection: 'column',
    gap: 16,
  },

  // Field styles
  fieldContainer: {
    flex: 1,
  },
  halfWidth: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  required: {
    color: '#ef4444',
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: '500',
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    paddingHorizontal: 12,
    height: 52,
    gap: 10,
  },
  inputFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: '#fff',
    borderWidth: 2,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    backgroundColor: Colors.primary[50],
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray[900],
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
  },
});

export default AddressForm;
