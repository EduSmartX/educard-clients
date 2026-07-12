/**
 * Supervisor Field Component (Reusable)
 * Dropdown to select a supervisor from organization users.
 * Auto-fetches users and formats them for display.
 * Shows a read-only text input in disabled/view mode for reliable display.
 * Used in Teacher and Student forms.
 */

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
import { useOrganizationUsers } from '@/hooks/use-supervisors';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface SupervisorFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  /** Display text for view/disabled mode (e.g., "Allen Williams") */
  viewValue?: string;
  /** Email to exclude from the dropdown (e.g., the current user's own email) */
  excludeEmail?: string;
}

/**
 * Reusable Supervisor Field Component
 * Displays a dropdown of organization users formatted as "Full Name (email)"
 * @param viewValue - Display text shown in disabled/view mode instead of Select dropdown
 */
export function SupervisorField<T extends FieldValues>({
  control,
  name,
  label = 'Supervisor',
  placeholder = 'Select supervisor',
  disabled = false,
  description = 'Optional: Assign a supervisor for this user',
  viewValue,
  excludeEmail,
}: SupervisorFieldProps<T>) {
  const { data: users = [], isLoading } = useOrganizationUsers();
  const filteredUsers = excludeEmail ? users.filter((u) => u.email !== excludeEmail) : users;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const matchedUser = filteredUsers.find((u) => u.email === (field.value as string));
        const resolvedDisplayValue =
          viewValue ||
          (matchedUser
            ? matchedUser.employee_id
              ? `${matchedUser.full_name} (${matchedUser.employee_id})`
              : `${matchedUser.full_name} (${matchedUser.email})`
            : '') ||
          (field.value as string) ||
          '';

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
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
              // Edit/create mode: show searchable dropdown
              <FormControl>
                <SearchableSelect
                  options={filteredUsers.map((user) => ({
                    value: user.email,
                    label: user.employee_id
                      ? `${user.full_name} (${user.employee_id})`
                      : `${user.full_name} (${user.email})`,
                  }))}
                  onValueChange={field.onChange}
                  value={(field.value as string) || ''}
                  placeholder={isLoading ? 'Loading supervisors...' : placeholder}
                  className="border-gray-300 bg-gray-50 transition-colors focus:bg-white disabled:cursor-default disabled:opacity-100"
                  disabled={isLoading}
                />
              </FormControl>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
