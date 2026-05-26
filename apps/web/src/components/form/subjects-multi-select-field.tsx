/**
 * Subjects Multi-Select Field Component
 * Allows selecting multiple subjects for teachers
 * Fetches core/master subjects (not organization-specific)
 */

import { useCoreSubjects } from '@/features/core/hooks/use-core-subjects';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { GenericMultiSelectField } from './generic-multi-select-field';
import { useMemo } from 'react';

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

  const subjects = useMemo(() => (Array.isArray(coreSubjects) ? coreSubjects : []), [coreSubjects]);

  const options = useMemo(
    () =>
      subjects.map((subject) => ({
        value: subject.id.toString(),
        label: `${subject.name} (${subject.code})`,
      })),
    [subjects]
  );

  const formatDisplayValue = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === Number(subjectId));
    return subject ? `${subject.name} (${subject.code})` : String(subjectId);
  };

  return (
    <GenericMultiSelectField<TFieldValues, number>
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="Search subjects..."
      disabled={disabled}
      description={description}
      isLoading={isLoading}
      options={options}
      formatDisplayValue={formatDisplayValue}
      parseValue={Number}
      allSelectedMessage="All subjects selected"
      noItemsMessage="No subjects available"
      loadingMessage="Loading subjects..."
      badgeContainerClassName="flex flex-wrap gap-2 rounded-md border bg-gray-50 p-3"
    />
  );
}
