import type { Class } from '@educard/shared';

import { FormDropdown } from '@/components/forms/FormDropdown';
import { useClasses } from '@/features/classes';

type ClassLike = Class & {
  class_master_name?: string;
};

export interface ClassOption {
  value: string;
  label: string;
}

export function getClassLabel(cls: Partial<ClassLike> & { name?: string }): string {
  const masterName = cls.class_master_name ?? cls.class_master?.name ?? '';
  const sectionName = cls.name ?? '';

  if (masterName && sectionName) {
    return `${masterName} - ${sectionName}`;
  }

  return masterName || sectionName || 'Class';
}

export function buildClassOptions(classes: Partial<ClassLike>[]): ClassOption[] {
  return classes
    .filter((cls): cls is Partial<ClassLike> & { public_id: string } => !!cls.public_id)
    .map((cls) => ({
      value: cls.public_id,
      label: getClassLabel(cls),
    }));
}

interface ClassFilterDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  pageSize?: number;
}

export function ClassFilterDropdown({
  label = 'Class',
  value,
  onChange,
  error,
  required,
  placeholder = 'Select class...',
  disabled,
  includeAllOption = true,
  allOptionLabel = 'All Classes',
  pageSize = 200,
}: ClassFilterDropdownProps) {
  const { data: classesData, isLoading } = useClasses({ page_size: pageSize });

  const classOptions = buildClassOptions(classesData?.classes ?? []);
  const options = includeAllOption
    ? [{ value: '', label: allOptionLabel }, ...classOptions]
    : classOptions;

  return (
    <FormDropdown
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
      loading={isLoading}
      searchable
    />
  );
}
