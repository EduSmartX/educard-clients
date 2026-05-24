/**
 * Classes Multi-Select Field Component
 * Allows selecting multiple classes with badges displayed below
 * Features: Searchable dropdown, scrollable list, master class names
 */

import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { X } from 'lucide-react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface ClassOption {
  public_id: string;
  name: string;
  section?: string;
  master_class?: string;
  display_name?: string;
}

interface ClassesMultiSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  classes: ClassOption[];
  isLoading?: boolean;
}

export function ClassesMultiSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label = 'Classes',
  placeholder = 'Select classes for this fee structure',
  disabled = false,
  description,
  classes,
  isLoading = false,
}: ClassesMultiSelectFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedClassIds: string[] = Array.isArray(field.value) ? field.value : [];
        const availableClasses = Array.isArray(classes)
          ? classes.filter((cls) => !selectedClassIds.includes(cls.public_id))
          : [];

        // Format class name to show master class name
        const formatClassName = (cls: ClassOption) => {
          // First priority: use display_name if available
          if (cls.display_name) {
            return cls.display_name;
          }

          // Second priority: if name already contains ' - ', it's formatted (e.g., "Pre-KG - Demo U")
          if (cls.name.includes(' - ')) {
            return cls.name;
          }

          // Third priority: combine master_class with section/name
          if (cls.master_class) {
            return `${cls.master_class} - ${cls.name}`;
          }

          // Fourth priority: combine with section if available
          if (cls.section) {
            return `${cls.name} - ${cls.section}`;
          }

          // Fallback: just return name
          return cls.name;
        };

        const selectOptions = availableClasses.map((cls) => ({
          value: cls.public_id,
          label: formatClassName(cls),
        }));

        return (
          <FormItem>
            <FormLabel className="font-medium">{label}</FormLabel>
            <div className="space-y-2">
              {/* Searchable dropdown to add classes */}
              <FormControl>
                <SearchableSelect
                  options={selectOptions}
                  value=""
                  onValueChange={(value) => {
                    if (value && !selectedClassIds.includes(value)) {
                      field.onChange([...selectedClassIds, value]);
                    }
                  }}
                  placeholder={placeholder}
                  searchPlaceholder="Search classes..."
                  emptyText={
                    isLoading
                      ? 'Loading classes...'
                      : selectedClassIds.length > 0
                        ? 'All classes selected'
                        : 'No classes available'
                  }
                  disabled={disabled || isLoading || availableClasses.length === 0}
                  className="border-gray-300 bg-gray-50 focus:bg-white"
                />
              </FormControl>

              {/* Display selected classes as badges below */}
              {selectedClassIds.length > 0 && (
                <div className="flex max-h-[200px] flex-wrap gap-2 overflow-y-auto rounded-md border bg-gray-50 p-3">
                  {selectedClassIds.map((classId) => {
                    const classObj = classes.find((c) => c.public_id === classId);
                    return (
                      <Badge
                        key={classId}
                        variant="secondary"
                        className="gap-1.5 px-3 py-1.5 text-sm"
                      >
                        <span>{classObj ? formatClassName(classObj) : classId}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange(selectedClassIds.filter((id) => id !== classId))
                            }
                            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {description && <FormDescription className="text-xs">{description}</FormDescription>}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
