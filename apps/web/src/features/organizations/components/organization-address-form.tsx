/**
 * Organization Address Form
 * Update organization address information
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { AddressForm } from '@/components/forms/address-form';
import { useUpdateOrganizationAddress } from '../hooks/mutations';
import type { Organization } from '../api/organization-api';
import { STANDARD_FORM_VALIDATION_CONFIG } from '@/lib/utils/form-validation';

const organizationAddressSchema = z.object({
  street_address: z.string().min(1, 'Street address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
});

type OrganizationAddressFormData = z.infer<typeof organizationAddressSchema>;

interface OrganizationAddressFormProps {
  organization: Organization | undefined;
  isLoading: boolean;
}

export function OrganizationAddressForm({ organization, isLoading }: OrganizationAddressFormProps) {
  const updateMutation = useUpdateOrganizationAddress(organization?.public_id || '');

  const form = useForm<OrganizationAddressFormData>({
    resolver: zodResolver(organizationAddressSchema),
    ...STANDARD_FORM_VALIDATION_CONFIG,
    defaultValues: {
      street_address: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'India',
    },
  });

  useEffect(() => {
    if (organization?.address) {
      form.reset({
        street_address: organization.address.street_address || '',
        address_line_2: organization.address.address_line_2 || '',
        city: organization.address.city || '',
        state: organization.address.state || '',
        zip_code: organization.address.zip_code || '',
        country: organization.address.country || 'India',
      });
    }
  }, [organization, form]);

  const onSubmit = (values: OrganizationAddressFormData) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-base font-medium">Organization Address</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <AddressForm
            form={form}
            required
            showHeader={false}
            showLocationButton={true}
            showAddressType={false}
            fieldNames={{
              streetAddress: 'street_address',
              addressLine2: 'address_line_2',
              city: 'city',
              state: 'state',
              zipCode: 'zip_code',
              country: 'country',
            }}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="brandOutline"
              onClick={() => form.reset()}
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={updateMutation.isPending || !form.formState.isDirty}
              className="shadow-lg disabled:shadow-none"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Address
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </CardContent>
    </>
  );
}
