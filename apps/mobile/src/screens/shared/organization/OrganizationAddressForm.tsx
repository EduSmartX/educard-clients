import { Colors } from '@educard/shared';
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
import { AddressForm, type AddressData } from '@/components/forms/AddressForm';
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

export function OrganizationAddressForm({
  organization,
}: OrganizationAddressFormProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [values, setValues] = useState<AddressData>(EMPTY);

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
    }
  }, [organization]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateOrganizationAddressPayload) =>
      updateOrganizationAddress(organization.public_id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organization', 'profile'] });
      showToast({ type: 'success', title: 'Address updated' });
    },
    onError: err => {
      showToast({
        type: 'error',
        title: 'Update failed',
        message: getErrorMessage(err, 'Please try again.'),
      });
    },
  });

  const handleChange = (field: keyof AddressData, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (
      !values.streetAddress.trim() ||
      !values.city.trim() ||
      !values.state.trim() ||
      !values.zipCode.trim() ||
      !values.country.trim()
    ) {
      showToast({
        type: 'error',
        title: 'Please fill all required address fields',
      });
      return;
    }
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
      <AddressForm values={values} onChange={handleChange} required />

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
