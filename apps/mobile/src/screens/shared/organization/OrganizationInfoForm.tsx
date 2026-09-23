import {
  Colors,
  ORGANIZATION_TYPES,
  BOARD_AFFILIATIONS,
  getFieldErrors,
} from '@educard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { getErrorMessage } from '@/api/client';
import {
  updateOrganization,
  type OrganizationProfile,
  type UpdateOrganizationPayload,
} from '@/api/organization';
import { FormInput } from '@/components/forms/FormInput';
import { FormDropdown } from '@/components/forms/FormDropdown';
import { useToast } from '@/lib/toast-context';

interface OrganizationInfoFormProps {
  organization: OrganizationProfile;
}

type InfoState = Required<
  Pick<
    UpdateOrganizationPayload,
    | 'name'
    | 'organization_type'
    | 'board_affiliation'
    | 'email'
    | 'phone'
    | 'registration_number'
    | 'corporate_identification_number'
    | 'tax_id'
    | 'website_url'
  >
>;

const EMPTY: InfoState = {
  name: '',
  organization_type: '',
  board_affiliation: '',
  email: '',
  phone: '',
  registration_number: '',
  corporate_identification_number: '',
  tax_id: '',
  website_url: '',
};

export function OrganizationInfoForm({
  organization,
}: OrganizationInfoFormProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<InfoState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({
      name: organization.name ?? '',
      organization_type: organization.organization_type ?? '',
      board_affiliation: organization.board_affiliation ?? '',
      email: organization.email ?? '',
      phone: organization.phone ?? '',
      registration_number: organization.registration_number ?? '',
      corporate_identification_number:
        organization.corporate_identification_number ?? '',
      tax_id: organization.tax_id ?? '',
      website_url: organization.website_url ?? '',
    });
  }, [
    organization.public_id,
    organization.name,
    organization.organization_type,
    organization.board_affiliation,
    organization.email,
    organization.phone,
    organization.registration_number,
    organization.corporate_identification_number,
    organization.tax_id,
    organization.website_url,
  ]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      updateOrganization(organization.public_id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['organization', 'profile'] });
      showToast({ type: 'success', title: 'Organization updated' });
    },
    onError: err => {
      // Prefer inline field errors from the API; only popup for non-field errors.
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }
      showToast({
        type: 'error',
        title: 'Update failed',
        message: getErrorMessage(err, 'Please try again.'),
      });
    },
  });

  const setField = useCallback(
    (key: keyof InfoState) => (value: string) => {
      setForm(prev => ({ ...prev, [key]: value }));
      setErrors(prev => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Organization name is required';
    if (!form.email.trim()) nextErrors.email = 'Email address is required';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    mutation.mutate(form);
  };

  return (
    <View style={styles.container}>
      <FormInput
        label="Organization Name"
        value={form.name}
        onChangeText={setField('name')}
        placeholder="e.g. Springfield High School"
        error={errors.name}
        required
      />
      <FormDropdown
        label="Organization Type"
        placeholder="Select type"
        options={[...ORGANIZATION_TYPES]}
        value={form.organization_type}
        onChange={setField('organization_type')}
      />
      <FormDropdown
        label="Board Affiliation"
        placeholder="Select board"
        options={[...BOARD_AFFILIATIONS]}
        value={form.board_affiliation}
        onChange={setField('board_affiliation')}
      />
      <FormInput
        label="Email Address"
        value={form.email}
        onChangeText={setField('email')}
        placeholder="org@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        required
      />
      <FormInput
        label="Phone Number"
        value={form.phone}
        onChangeText={setField('phone')}
        placeholder="Phone number"
        keyboardType="phone-pad"
        error={errors.phone}
      />
      <FormInput
        label="Registration Number"
        value={form.registration_number}
        onChangeText={setField('registration_number')}
        placeholder="Registration number"
        error={errors.registration_number}
      />
      <FormInput
        label="Corporate Identification Number (CIN)"
        value={form.corporate_identification_number}
        onChangeText={setField('corporate_identification_number')}
        placeholder="e.g. L12345MH2000PLC123456"
        autoCapitalize="characters"
        error={errors.corporate_identification_number}
      />
      <FormInput
        label="Tax ID / GSTIN"
        value={form.tax_id}
        onChangeText={setField('tax_id')}
        placeholder="e.g. 27AABCU9603R1ZM"
        autoCapitalize="characters"
        error={errors.tax_id}
      />
      <FormInput
        label="Website"
        value={form.website_url}
        onChangeText={setField('website_url')}
        placeholder="https://example.com"
        keyboardType="url"
        autoCapitalize="none"
        error={errors.website_url}
      />

      <TouchableOpacity
        style={[styles.saveBtn, mutation.isPending && styles.dimmed]}
        disabled={mutation.isPending}
        onPress={handleSave}
      >
        <Save size={18} color="#ffffff" />
        <Text style={styles.saveText}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
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
