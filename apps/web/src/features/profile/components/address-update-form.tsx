/**
 * Address Update Form
 * Update residential address
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { AddressForm } from '@/components/forms/address-form';
import { useUserProfile } from '../hooks/queries';
import { useUpdateAddress } from '../hooks/mutations';
import { addressUpdateSchema, type AddressUpdateFormData } from '../schemas/profile-schemas';

export function AddressUpdateForm() {
  const { data: profile, isLoading } = useUserProfile();
  const updateMutation = useUpdateAddress();

  const form = useForm<AddressUpdateFormData>({
    resolver: zodResolver(addressUpdateSchema),
    defaultValues: {
      street_address: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
    },
  });

  useEffect(() => {
    if (profile?.address) {
      form.reset({
        street_address: profile.address.street_address || '',
        address_line_2: profile.address.address_line_2 || '',
        city: profile.address.city || '',
        state: profile.address.state || '',
        zip_code: profile.address.zip_code || '',
        country: profile.address.country || '',
      });
    }
  }, [profile, form]);

  const onSubmit = (values: AddressUpdateFormData) => {
    // Use the profile update mutation with address payload
    updateMutation.mutate({
      address: {
        ...values,
        address_type: 'user_current', // Default address type for profile
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Residential Address</CardTitle>
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
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Address
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
