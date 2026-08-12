/**
 * AddressForm - Reusable Address Form Component
 *
 * Field-level address form (Street, City, State, ZIP, Country) with optional
 * address line 2. Location auto-fill is deferred to the permissions/location
 * migration track and intentionally omitted here.
 */

import { Colors } from '@educard/shared';
import {
  MapPin,
  Home,
  Building2,
  MapPinned,
  Hash,
  Globe,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

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
  compact: _compact = false,
  disabled = false,
}: AddressFormProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    },
  ) => {
    const isFocused = focusedField === field;
    const hasError = !!errors[field];
    const isOptional = options?.optional ?? false;

    return (
      <View style={styles.fieldContainer}>
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
          />
        </View>
        {hasError && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <MapPin size={20} color={Colors.success[600]} />
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

      <View style={styles.fieldsContainer}>
        {renderField(
          'streetAddress',
          'Street Address',
          '123 Main Street',
          <Home
            size={18}
            color={
              focusedField === 'streetAddress'
                ? Colors.primary[500]
                : Colors.gray[400]
            }
          />,
          { autoCapitalize: 'words' },
        )}

        {renderField(
          'addressLine2',
          'Address Line 2',
          'Apartment, Suite, Building',
          <Building2
            size={18}
            color={
              focusedField === 'addressLine2'
                ? Colors.primary[500]
                : Colors.gray[400]
            }
          />,
          { optional: true, autoCapitalize: 'words' },
        )}
        {renderField(
          'city',
          'City',
          'City',
          <MapPinned
            size={18}
            color={
              focusedField === 'city' ? Colors.primary[500] : Colors.gray[400]
            }
          />,
          { autoCapitalize: 'words' },
        )}
        {renderField(
          'state',
          'State',
          'State',
          <MapPin
            size={18}
            color={
              focusedField === 'state' ? Colors.primary[500] : Colors.gray[400]
            }
          />,
          { autoCapitalize: 'words' },
        )}
        {renderField(
          'zipCode',
          'PIN Code',
          '123456',
          <Hash
            size={18}
            color={
              focusedField === 'zipCode'
                ? Colors.primary[500]
                : Colors.gray[400]
            }
          />,
          { keyboardType: 'numeric' },
        )}
        {renderField(
          'country',
          'Country',
          'India',
          <Globe
            size={18}
            color={
              focusedField === 'country'
                ? Colors.primary[500]
                : Colors.gray[400]
            }
          />,
          { autoCapitalize: 'words' },
        )}
      </View>
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
  fieldsContainer: {
    gap: 16,
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
