/**
 * Classes Multi-Select Field Component
 * Allows selecting multiple classes with badges displayed below
 * Features: Searchable dropdown, scrollable list, master class names
 */

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { GenericMultiSelectField } from './generic-multi-select-field';
import { useMemo } from 'react';

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

  const options = useMemo(
    () =>
      classes.map((cls) => ({
        value: cls.public_id,
        label: formatClassName(cls),
      })),
    [classes]
  );

  const formatDisplayValue = (classId: string) => {
    const classObj = classes.find((c) => c.public_id === classId);
    return classObj ? formatClassName(classObj) : classId;
  };

  return (
    <GenericMultiSelectField<TFieldValues, string>
      control={control}
      name={name}
      label={label}
      placeholder={placeholder}
      searchPlaceholder="Search classes..."
      disabled={disabled}
      description={description}
      isLoading={isLoading}
      options={options}
      formatDisplayValue={formatDisplayValue}
      allSelectedMessage="All classes selected"
      noItemsMessage="No classes available"
      loadingMessage="Loading classes..."
    />
  );
}
