/**
 * Reusable Academic Year Dropdown
 * Pre-populates with current academic year from the API.
 * Can be used in any form that needs academic year selection.
 */

import { useMemo } from 'react';

import { useCurrentAcademicYear } from '@/features/core';

import { FormDropdown } from './FormDropdown';

interface AcademicYearOption {
  readonly label: string;
  readonly value: string;
}

interface AcademicYearDropdownProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly extraOptions?: readonly AcademicYearOption[];
}

export function AcademicYearDropdown({
  value,
  onChange,
  label = 'Academic Year',
  placeholder = 'Select academic year',
  required = false,
  error,
  extraOptions,
}: AcademicYearDropdownProps) {
  const { data: currentAcademicYear, isLoading } = useCurrentAcademicYear();

  const options = useMemo(() => {
    const opts: AcademicYearOption[] = [];
    if (currentAcademicYear) {
      opts.push({
        label: currentAcademicYear.name,
        value: currentAcademicYear.public_id,
      });
    }
    // Include caller-provided years (e.g. the saved year on edit) so the value always has a labelled option.
    for (const extra of extraOptions ?? []) {
      if (extra.value && !opts.some(o => o.value === extra.value)) {
        opts.push(extra);
      }
    }
    return opts;
  }, [currentAcademicYear, extraOptions]);

  return (
    <FormDropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={isLoading ? 'Loading...' : placeholder}
      required={required}
      error={error}
    />
  );
}
