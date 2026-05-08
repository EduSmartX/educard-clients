/**
 * Organization Info Form
 * Update organization basic information
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { TextInputField } from '@/components/forms/form-fields';
import { SelectField } from '@/components/forms/form-fields';
import { useUpdateOrganization } from '../hooks/mutations';
import type { Organization } from '../api/organization-api';
import {
  ORGANIZATION_TYPE_OPTIONS,
  BOARD_AFFILIATION_OPTIONS,
} from '@/constants/organization-types';
import { CommonUiText, FormPlaceholders } from '@/constants';
import { STANDARD_FORM_VALIDATION_CONFIG } from '@/lib/utils/form-validation';

const organizationInfoSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  organization_type: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  registration_number: z.string().optional(),
  corporate_identification_number: z.string().optional(),
  tax_id: z.string().optional(),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  board_affiliation: z.string().optional(),
});

type OrganizationInfoFormData = z.infer<typeof organizationInfoSchema>;

interface OrganizationInfoFormProps {
  organization: Organization | undefined;
  isLoading: boolean;
}

export function OrganizationInfoForm({ organization, isLoading }: OrganizationInfoFormProps) {
  const updateMutation = useUpdateOrganization(organization?.public_id || '');

  const form = useForm<OrganizationInfoFormData>({
    resolver: zodResolver(organizationInfoSchema),
    ...STANDARD_FORM_VALIDATION_CONFIG,
    defaultValues: {
      name: '',
      organization_type: '',
      email: '',
      phone: '',
      registration_number: '',
      corporate_identification_number: '',
      tax_id: '',
      website_url: '',
      board_affiliation: '',
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        organization_type: organization.organization_type || '',
        email: organization.email || '',
        phone: organization.phone || '',
        registration_number: organization.registration_number || '',
        corporate_identification_number: organization.corporate_identification_number || '',
        tax_id: organization.tax_id || '',
        website_url: organization.website_url || '',
        board_affiliation: organization.board_affiliation || '',
      });
    }
  }, [organization, form]);

  const onSubmit = (values: OrganizationInfoFormData) => {
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
        <CardTitle className="text-base font-medium">Organization Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextInputField
                control={form.control}
                name="name"
                label="Organization Name"
                placeholder={FormPlaceholders.ORG_NAME_EXAMPLE}
                required
              />
            </div>

            <SelectField
              control={form.control}
              name="organization_type"
              label="Organization Type"
              placeholder={FormPlaceholders.SELECT_OPTION}
              options={ORGANIZATION_TYPE_OPTIONS}
            />

            <SelectField
              control={form.control}
              name="board_affiliation"
              label="Board Affiliation"
              placeholder={FormPlaceholders.SELECT_OPTION}
              options={BOARD_AFFILIATION_OPTIONS}
            />

            <TextInputField
              control={form.control}
              name="email"
              label="Email Address"
              placeholder={FormPlaceholders.ORG_EMAIL_EXAMPLE}
              type="email"
              required
            />

            <TextInputField
              control={form.control}
              name="phone"
              label="Phone Number"
              placeholder={FormPlaceholders.PHONE_EXAMPLE}
              type="tel"
            />

            <TextInputField
              control={form.control}
              name="registration_number"
              label="Registration Number"
              placeholder={FormPlaceholders.REGISTRATION_NUMBER_EXAMPLE}
            />

            <TextInputField
              control={form.control}
              name="corporate_identification_number"
              label="Corporate Identification Number (CIN)"
              placeholder={FormPlaceholders.CIN_EXAMPLE}
            />

            <TextInputField
              control={form.control}
              name="tax_id"
              label="Tax ID / GSTIN"
              placeholder={FormPlaceholders.GSTIN_EXAMPLE}
            />

            <TextInputField
              control={form.control}
              name="website_url"
              label="Website"
              placeholder={FormPlaceholders.WEBSITE_EXAMPLE}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="brandOutline"
              onClick={() => form.reset()}
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              {CommonUiText.RESET}
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
                  {CommonUiText.SAVING}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {CommonUiText.SAVE_CHANGES}
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
