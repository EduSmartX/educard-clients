import { Colors, getFieldErrors } from '@educard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { getErrorMessage } from '@/api/client';
import {
  updateOrganizationAddress,
  type OrganizationProfile,
  type UpdateOrganizationAddressPayload,
} from '@/api/organization';
import {
  AddressForm,
  type AddressData,
  type AddressErrors,
} from '@/components/forms/AddressForm';
import { useToast } from '@/lib/toast-context';

interface OrganizationAddressFormProps {
  organization: OrganizationProfile;
}

const EMPTY: AddressData = {
  streetAddress: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
};

const BACKEND_FIELD_MAP: Record<string, keyof AddressData> = {
  street_address: 'streetAddress',
  address_line_2: 'addressLine2',
  city: 'city',
  state: 'state',
  zip_code: 'zipCode',
  country: 'country',
};

export function OrganizationAddressForm({
  organization,
}: OrganizationAddressFormProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [values, setValues] = useState<AddressData>(EMPTY);
  const [errors, setErrors] = useState<AddressErrors>({});

  useEffect(() => {
    const address = organization.address;
    if (address) {
      setValues({
        streetAddress: address.street_address ?? '',
        addressLine2: address.address_line_2 ?? '',
        city: address.city ?? '',
        state: address.state ?? '',
        zipCode: address.zip_code ?? '',
        country: address.country ?? 'India',
      });
    } else {
      // Reset to empty if address is null/undefined
      setValues(EMPTY);
    }
  }, [organization.address, organization.public_id]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateOrganizationAddressPayload) =>
      updateOrganizationAddress(organization.public_id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organization', 'profile'] });
      showToast({ type: 'success', title: 'Address updated' });
    },
    onError: err => {
      // Prefer inline field errors from the API; only popup for non-field errors.
      const apiErrors = getFieldErrors(err);
      const mapped: AddressErrors = {};
      let hasFieldError = false;
      for (const [backendField, message] of Object.entries(apiErrors)) {
        const field = BACKEND_FIELD_MAP[backendField];
        if (field) {
          mapped[field] = message;
          hasFieldError = true;
        }
      }
      if (hasFieldError) {
        setErrors(mapped);
        return;
      }
      showToast({
        type: 'error',
        title: 'Update failed',
        message: getErrorMessage(err, 'Please try again.'),
      });
    },
  });

  const handleChange = (field: keyof AddressData, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSave = () => {
    const nextErrors: AddressErrors = {};
    if (!values.streetAddress.trim())
      nextErrors.streetAddress = 'Street address is required';
    if (!values.city.trim()) nextErrors.city = 'City is required';
    if (!values.state.trim()) nextErrors.state = 'State is required';
    if (!values.zipCode.trim()) nextErrors.zipCode = 'ZIP code is required';
    if (!values.country.trim()) nextErrors.country = 'Country is required';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    mutation.mutate({
      street_address: values.streetAddress,
      address_line_2: values.addressLine2,
      city: values.city,
      state: values.state,
      zip_code: values.zipCode,
      country: values.country,
    });
  };

  return (
    <View style={styles.container}>
      <AddressForm
        values={values}
        onChange={handleChange}
        errors={errors}
        required
      />

      <TouchableOpacity
        style={[styles.saveBtn, mutation.isPending && styles.dimmed]}
        disabled={mutation.isPending}
        onPress={handleSave}
      >
        <Save size={18} color="#ffffff" />
        <Text style={styles.saveText}>
          {mutation.isPending ? 'Saving...' : 'Save Address'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  dimmed: {
    opacity: 0.6,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
