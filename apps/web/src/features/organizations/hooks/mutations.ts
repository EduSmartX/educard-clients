/**
 * Organization Mutations
 * React Query hooks for organization mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateOrganization, updateOrganizationAddress } from '../api/organization-api';
import { ErrorMessages, SuccessMessages } from '@/constants';
import type {
  UpdateOrganizationPayload,
  UpdateOrganizationAddressPayload,
} from '../api/organization-api';

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
    onError: () => {
      toast.error(ErrorMessages.ORGANIZATION.UPDATE_FAILED);
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
    onError: () => {
      toast.error(ErrorMessages.ORGANIZATION.UPDATE_FAILED);
    },
  });
}
