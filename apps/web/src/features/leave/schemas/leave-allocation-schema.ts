/**
 * Leave Allocation Form Validation Schema
 * Uses Zod for type-safe form validation with comprehensive business rules
 */

import { z } from 'zod';

/**
 * Schema factory for Leave Allocation Form
 * Supports create, edit, and view modes with different validation rules
 */
export const createLeaveAllocationSchema = (mode: 'create' | 'view' | 'edit' = 'create') => {
  return z
    .object({
      leave_type:
        mode === 'edit'
          ? z.number().optional()
          : z
              .number({
                message: 'Please select a valid leave type',
              })
              .min(1, 'Leave type is required'),

      name: z.string().max(100, 'Name must not exceed 100 characters').optional().or(z.literal('')),

      description: z
        .string()
        .max(500, 'Description must not exceed 500 characters')
        .optional()
        .or(z.literal('')),

      total_days: z
        .string({
          message: 'Total days is required',
        })
        .min(1, 'Total days is required')
        .refine(
          (val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0 && num <= 365;
          },
          {
            message: 'Total days must be between 0.5 and 365',
          }
        ),

      max_carry_forward_days: z
        .string({
          message: 'Maximum carry forward days is required',
        })
        .refine(
          (val) => {
            if (val === '0') {
              return true;
            } // carry forward disabled
            if (!val || val.trim() === '') {
              return false;
            } // empty when enabled
            const num = parseFloat(val);
            return !isNaN(num) && num > 0 && num <= 365;
          },
          {
            message: 'Maximum carry forward days must be between 0.5 and 365',
          }
        ),

      applies_to_all_roles: z.boolean().default(false),

      roles: z.array(z.number()).default([]),

      effective_from: z.date().optional(),

      effective_to: z.date().optional().nullable(),
    })
    .refine(
      (data) => {
        // Either applies_to_all_roles must be true OR at least one role must be selected
        return data.applies_to_all_roles || data.roles.length > 0;
      },
      {
        message: "Either enable 'Applies to All Roles' or select at least one role",
        path: ['roles'],
      }
    )
    .refine(
      (data) => {
        // Validate max_carry_forward_days <= total_days
        const totalDays = parseFloat(data.total_days);
        const carryForward = parseFloat(data.max_carry_forward_days);
        return !isNaN(totalDays) && !isNaN(carryForward) && carryForward <= totalDays;
      },
      {
        message: 'Carry forward days cannot exceed total allocated days',
        path: ['max_carry_forward_days'],
      }
    )
    .refine(
      (data) => {
        // Validate effective_to > effective_from (if both provided)
        if (data.effective_to && data.effective_from) {
          return data.effective_to > data.effective_from;
        }
        return true;
      },
      {
        message: 'End date must be after start date',
        path: ['effective_to'],
      }
    );
};

export type LeaveAllocationFormValues = z.infer<ReturnType<typeof createLeaveAllocationSchema>>;

/**
 * Default form values for create mode
 */
export const getDefaultLeaveAllocationValues = (): Partial<LeaveAllocationFormValues> => {
  return {
    leave_type: undefined,
    name: '',
    description: '',
    total_days: '',
    max_carry_forward_days: '0',
    applies_to_all_roles: false,
    roles: [],
    effective_from: undefined,
    effective_to: undefined,
  };
};
