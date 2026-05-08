/**
 * Organization Role Select Field Component
 * Reusable dropdown for selecting organization roles
 * Fetches roles from API and uses IDs as values (matching subjects pattern)
 * Shows a read-only text input in disabled/view mode for reliable display
 */

import { useEffect } from 'react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useOrganizationRoles } from '@/hooks/use-organization-roles';
import type { Control, ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

interface OrganizationRoleFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultRoleCode?: string; // e.g., "TEACHER", "STUDENT"
  /** Display text for view/disabled mode (e.g., "Vice Principal") */
  viewValue?: string;
}

/** Inner component so hooks can be called at the top level. */
function RoleFieldContent<T extends FieldValues>({
  field,
  orgRoles,
  isLoading,
  label,
  placeholder,
  required,
  disabled,
  defaultRoleCode,
  viewValue,
}: {
  field: ControllerRenderProps<T, Path<T>>;
  orgRoles: { id: number; name: string; code: string }[];
  isLoading: boolean;
  label: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  defaultRoleCode?: string;
  viewValue?: string;
}) {
  // Auto-set default role when roles load (for create mode)
  useEffect(() => {
    if (!field.value && defaultRoleCode && orgRoles.length > 0) {
      const defaultRole = orgRoles.find((role) => role.code === defaultRoleCode);
      if (defaultRole) {
        field.onChange(defaultRole.id.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgRoles.length, defaultRoleCode]);

  const resolvedDisplayValue =
    viewValue || orgRoles.find((r) => r.id.toString() === (field.value as string))?.name || '';

  return (
    <FormItem>
      <FormLabel>
        {label} {required && <span className="text-red-500">*</span>}
      </FormLabel>
      {disabled ? (
        <FormControl>
          <Input
            value={resolvedDisplayValue || '—'}
            disabled
            readOnly
            className="border-gray-300 bg-gray-50 transition-colors disabled:cursor-default disabled:opacity-100"
          />
        </FormControl>
      ) : (
        <Select
          onValueChange={field.onChange}
          value={(field.value as string) || ''}
          key={`${field.value}-${orgRoles.length}`}
        >
          <FormControl>
            <SelectTrigger className="border-gray-300 bg-gray-50 transition-colors focus:bg-white disabled:cursor-default disabled:opacity-100">
              <SelectValue placeholder={isLoading ? 'Loading roles...' : placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {orgRoles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {defaultRoleCode && <FormDescription>Organization role for this user</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

/**
 * Organization Role Select Field
 * @param defaultRoleCode - The default role code to pre-fill (e.g., "TEACHER" for teachers, "STUDENT" for students)
 * @param viewValue - Display text shown in disabled/view mode instead of Select dropdown
 */
export function OrganizationRoleField<T extends FieldValues>({
  control,
  name,
  label = 'Organization Role',
  placeholder = 'Select organization role',
  required = false,
  disabled = false,
  defaultRoleCode,
  viewValue,
}: OrganizationRoleFieldProps<T>) {
  const { data: orgRoles = [], isLoading } = useOrganizationRoles();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <RoleFieldContent
          field={field}
          orgRoles={orgRoles}
          isLoading={isLoading}
          label={label}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          defaultRoleCode={defaultRoleCode}
          viewValue={viewValue}
        />
      )}
    />
  );
}
