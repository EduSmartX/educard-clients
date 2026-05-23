/**
 * Subjects Multi-Select Field Component
 * Allows selecting multiple subjects for teachers
 * Fetches core/master subjects (not organization-specific)
 */

import { Badge } from '@/components/ui/badge';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useCoreSubjects } from '@/features/core/hooks/use-core-subjects';
import { X } from 'lucide-react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface SubjectsMultiSelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
}

export function SubjectsMultiSelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label = 'Subjects',
  placeholder = 'Select subjects this teacher can teach',
  disabled = false,
  description,
}: SubjectsMultiSelectFieldProps<TFieldValues>) {
  // Fetch all core subjects (master subjects from the system)
  const { data: coreSubjects, isLoading } = useCoreSubjects();
  // Ensure subjects is always an array
  const subjects = Array.isArray(coreSubjects) ? coreSubjects : [];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedSubjects: number[] = Array.isArray(field.value) ? field.value : [];
        const availableSubjects = Array.isArray(subjects)
          ? subjects.filter((subject) => !selectedSubjects.includes(subject.id))
          : [];

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="space-y-2">
              {/* Dropdown to add subjects */}
              <SearchableSelect
                options={
                  isLoading
                    ? [{ value: 'loading', label: 'Loading subjects...', disabled: true }]
                    : availableSubjects.length === 0
                      ? [
                          {
                            value: 'none',
                            label:
                              selectedSubjects.length > 0
                                ? 'All subjects selected'
                                : 'No subjects available',
                            disabled: true,
                          },
                        ]
                      : availableSubjects.map((subject) => ({
                          value: subject.id.toString(),
                          label: `${subject.name} (${subject.code})`,
                        }))
                }
                value=""
                onValueChange={(value: string) => {
                  if (value) {
                    const subjectId = Number.parseInt(value);
                    if (!selectedSubjects.includes(subjectId)) {
                      field.onChange([...selectedSubjects, subjectId]);
                    }
                  }
                }}
                placeholder={placeholder}
                disabled={disabled || isLoading}
              />

              {/* Display selected subjects as badges */}
              {selectedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-md border bg-gray-50 p-3">
                  {selectedSubjects.map((subjectId) => {
                    const subject = subjects.find((s) => s.id === subjectId);
                    const handleRemove = () => {
                      field.onChange(selectedSubjects.filter((id) => id !== subjectId));
                    };
                    return (
                      <Badge
                        key={subjectId}
                        variant="secondary"
                        className="gap-1.5 px-3 py-1.5 text-sm"
                      >
                        <span>{subject ? `${subject.name} (${subject.code})` : subjectId}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={handleRemove}
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

              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
