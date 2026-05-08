/**
 * AddressFormSection - Reusable address form fields
 * Used in profile edit, teacher edit, student edit screens
 */

import { ChevronDown, ChevronUp, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { FormInput } from './FormInput';

interface AddressFormSectionProps {
  /** Form values */
  streetAddress: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  /** Field update callback */
  onFieldChange: (field: string, value: string) => void;
  /** Validation errors */
  errors?: Record<string, string>;
  /** Field blur callback for validation */
  onBlur?: (field: string) => void;
  /** Whether to show as collapsible section */
  collapsible?: boolean;
  /** Initial collapsed state */
  initialCollapsed?: boolean;
  /** Section title */
  title?: string;
}

export function AddressFormSection({
  streetAddress,
  addressLine2,
  city,
  state,
  zipCode,
  country,
  onFieldChange,
  errors = {},
  onBlur,
  collapsible = true,
  initialCollapsed = true,
  title = 'Address Information',
}: AddressFormSectionProps) {
  const [expanded, setExpanded] = useState(!initialCollapsed);

  const handleBlur = (field: string) => {
    if (onBlur) {
      onBlur(field);
    }
  };

  const content = (
    <View style={s.fieldsContainer}>
      <FormInput
        label="Street Address"
        value={streetAddress}
        onChangeText={(v) => onFieldChange('street_address', v)}
        onBlur={() => handleBlur('street_address')}
        placeholder="Enter street address"
        error={errors.street_address}
      />
      <FormInput
        label="Address Line 2"
        value={addressLine2 || ''}
        onChangeText={(v) => onFieldChange('address_line_2', v)}
        placeholder="Apartment, suite, etc. (optional)"
      />
      <View style={s.row}>
        <View style={s.halfField}>
          <FormInput
            label="City"
            value={city}
            onChangeText={(v) => onFieldChange('city', v)}
            onBlur={() => handleBlur('city')}
            placeholder="City"
            error={errors.city}
          />
        </View>
        <View style={s.halfField}>
          <FormInput
            label="State"
            value={state}
            onChangeText={(v) => onFieldChange('state', v)}
            onBlur={() => handleBlur('state')}
            placeholder="State"
            error={errors.state}
          />
        </View>
      </View>
      <View style={s.row}>
        <View style={s.halfField}>
          <FormInput
            label="Zip Code"
            value={zipCode}
            onChangeText={(v) => onFieldChange('postal_code', v)}
            onBlur={() => handleBlur('postal_code')}
            placeholder="Zip Code"
            error={errors.postal_code}
            keyboardType="number-pad"
          />
        </View>
        <View style={s.halfField}>
          <FormInput
            label="Country"
            value={country}
            onChangeText={(v) => onFieldChange('country', v)}
            onBlur={() => handleBlur('country')}
            placeholder="Country"
            error={errors.country}
          />
        </View>
      </View>
    </View>
  );

  if (!collapsible) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle}>{title}</Text>
        {content}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={s.toggleHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={s.toggleLeft}>
          <MapPin size={18} color="#6366f1" />
          <Text style={s.toggleTitle}>{title}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={20} color="#6b7280" />
        ) : (
          <ChevronDown size={20} color="#6b7280" />
        )}
      </TouchableOpacity>
      {expanded && content}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    padding: 14,
    paddingBottom: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  fieldsContainer: {
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
});
