/**
 * Holiday Mutations
 * All React Query mutations for holiday CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';
import type { CreateHolidayPayload, UpdateHolidayPayload } from '../types';
import {
  createHoliday,
  createHolidaysBulk,
  updateHoliday,
  deleteHoliday,
  bulkUploadHolidays,
} from '../api/holidays-api';
import { getErrorMessage, getFieldErrors } from '@/lib/utils/error-handler';
import {
  handleMutationError,
  type FieldErrors,
  type MutationOptions,
} from '@/lib/utils/mutation-utils';

export interface HolidayFieldErrors extends FieldErrors {
  start_date?: string;
  end_date?: string;
  holiday_type?: string;
  description?: string;
}

export type { MutationOptions };

export function useCreateHoliday(options?: MutationOptions<HolidayFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateHolidayPayload) => createHoliday(payload),
    onSuccess: () => {
      // Invalidate all holiday queries
      queryClient.invalidateQueries({ queryKey: ['holidays'] });

      toast.success(SuccessMessages.HOLIDAY.CREATE_SUCCESS, {
        description: 'The holiday has been created successfully.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'Failed to create holiday. Please try again.');
      const fieldErrors = getFieldErrors(error) as HolidayFieldErrors | undefined;

      if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
        toast.error(ToastTitles.ERROR, {
          description: errorMessage,
        });
      } else {
        toast.error(ToastTitles.VALIDATION_ERROR, {
          description: 'Please check the form fields and try again.',
        });
      }

      options?.onError?.(error, fieldErrors);
    },
  });
}

export function useCreateHolidaysBulk(options?: MutationOptions<HolidayFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payloads: CreateHolidayPayload[]) => createHolidaysBulk(payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });

      toast.success(SuccessMessages.HOLIDAY.BULK_UPLOAD_SUCCESS, {
        description: 'All holidays have been created successfully.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.HOLIDAY.CREATE_FAILED, options?.onError);
    },
  });
}

export function useUpdateHoliday(options?: MutationOptions<HolidayFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UpdateHolidayPayload> }) =>
      updateHoliday(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });

      toast.success(SuccessMessages.HOLIDAY.UPDATE_SUCCESS, {
        description: 'The holiday has been updated successfully.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'Failed to update holiday. Please try again.');
      const fieldErrors = getFieldErrors(error) as HolidayFieldErrors | undefined;

      if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
        toast.error(ToastTitles.ERROR, {
          description: errorMessage,
        });
      } else {
        toast.error(ToastTitles.VALIDATION_ERROR, {
          description: 'Please check the form fields and try again.',
        });
      }

      options?.onError?.(error, fieldErrors);
    },
  });
}

export function useDeleteHoliday(options?: MutationOptions<HolidayFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });

      toast.success(SuccessMessages.HOLIDAY.DELETE_SUCCESS, {
        description: 'The holiday has been deleted successfully.',
      });

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.HOLIDAY.DELETE_FAILED, options?.onError);
    },
  });
}

export function useBulkUploadHolidays(options?: MutationOptions<HolidayFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => bulkUploadHolidays(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });

      if (response.data.failed_count > 0) {
        toast.warning(ErrorMessages.HOLIDAY.BULK_UPLOAD_FAILED, {
          description: `${response.data.created_count} holidays created, ${response.data.failed_count} failed.`,
        });
      } else {
        toast.success(SuccessMessages.HOLIDAY.BULK_UPLOAD_SUCCESS, {
          description: `${response.data.created_count} holidays have been created successfully.`,
        });
      }

      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.HOLIDAY.BULK_UPLOAD_FAILED, options?.onError);
    },
  });
}
