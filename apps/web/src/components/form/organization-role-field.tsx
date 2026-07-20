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
import { SearchableSelect } from '@/components/ui/searchable-select';
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
  /** Role codes to exclude from the dropdown (e.g., ["STUDENT", "PARENT"]) */
  excludeRoleCodes?: string[];
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
        <FormControl>
          <SearchableSelect
            options={orgRoles.map((role) => ({
              value: role.id.toString(),
              label: role.name,
            }))}
            onValueChange={field.onChange}
            value={(field.value as string) || ''}
            key={`${field.value}-${orgRoles.length}`}
            placeholder={isLoading ? 'Loading roles...' : placeholder}
            className="border-gray-300 bg-gray-50 transition-colors focus:bg-white disabled:cursor-default disabled:opacity-100"
            disabled={isLoading}
          />
        </FormControl>
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
  excludeRoleCodes = [],
}: OrganizationRoleFieldProps<T>) {
  const { data: orgRoles = [], isLoading } = useOrganizationRoles();

  const filteredRoles = excludeRoleCodes.length
    ? orgRoles.filter((role) => !excludeRoleCodes.includes(role.code))
    : orgRoles;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <RoleFieldContent
          field={field}
          orgRoles={filteredRoles}
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
