/**
 * Class Select Field Component
 * Single class selection dropdown with search functionality
 * Shows master class names properly formatted
 */

import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface ClassOption {
  public_id: string;
  name: string;
  section?: string;
  master_class?: string;
  display_name?: string;
}

interface ClassSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  classes: ClassOption[];
  isLoading?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function ClassSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label = 'Class',
  placeholder = 'Select a class',
  disabled = false,
  description,
  classes,
  isLoading = false,
  className,
  showLabel = true,
}: ClassSelectFieldProps<TFieldValues>) {
  const formatClassName = (cls: ClassOption) => {
    if (cls.display_name) {
      return cls.display_name;
    }
    if (cls.name.includes(' - ')) {
      return cls.name;
    }
    if (cls.master_class) {
      return `${cls.master_class} - ${cls.name}`;
    }
    if (cls.section) {
      return `${cls.name} - ${cls.section}`;
    }
    return cls.name;
  };

  const selectOptions = classes.map((cls) => ({
    value: cls.public_id,
    label: formatClassName(cls),
  }));

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {showLabel && <FormLabel className="font-medium">{label}</FormLabel>}
          <FormControl>
            <SearchableSelect
              options={selectOptions}
              value={field.value}
              onValueChange={field.onChange}
              placeholder={placeholder}
              searchPlaceholder="Search classes..."
              emptyText={
                isLoading
                  ? 'Loading classes...'
                  : classes.length === 0
                    ? 'No classes available'
                    : 'No classes found'
              }
              disabled={disabled || isLoading}
              className={className}
            />
          </FormControl>
          {description && <FormDescription className="text-xs">{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
