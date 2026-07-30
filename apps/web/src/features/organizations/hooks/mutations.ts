/**
 * Organization Mutations
 * React Query hooks for organization mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  updateOrganization,
  updateOrganizationAddress,
  type UpdateOrganizationPayload,
  type UpdateOrganizationAddressPayload,
} from '../api/organization-api';
import { SuccessMessages } from '@/constants';

/**
 * Hook to update organization information
 */
export function useUpdateOrganization(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) => updateOrganization(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', publicId] });
      toast.success(SuccessMessages.ORGANIZATION.UPDATE_SUCCESS);
    },
  });
}

/**
 * Hook to update organization address
 */
export function useUpdateOrganizationAddress(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationAddressPayload) =>
      updateOrganizationAddress(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', publicId] });
      toast.success(SuccessMessages.ORGANIZATION.ADDRESS_UPDATE_SUCCESS);
    },
  });
}
