/**
 * Subjects Multi-Select Field Component
 * Allows selecting multiple subjects for teachers
 * Fetches core/master subjects (not organization-specific)
 */

import { Badge } from '@/components/ui/badge';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) {
                    const subjectId = parseInt(value);
                    if (!selectedSubjects.includes(subjectId)) {
                      field.onChange([...selectedSubjects, subjectId]);
                    }
                  }
                }}
                disabled={disabled || isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading subjects...
                    </SelectItem>
                  ) : availableSubjects.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {selectedSubjects.length > 0
                        ? 'All subjects selected'
                        : 'No subjects available'}
                    </SelectItem>
                  ) : (
                    availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Display selected subjects as badges */}
              {selectedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border">
                  {selectedSubjects.map((subjectId) => {
                    const subject = subjects.find((s) => s.id === subjectId);
                    return (
                      <Badge
                        key={subjectId}
                        variant="secondary"
                        className="gap-1.5 py-1.5 px-3 text-sm"
                      >
                        <span>{subject ? `${subject.name} (${subject.code})` : subjectId}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(selectedSubjects.filter((id) => id !== subjectId));
                            }}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
