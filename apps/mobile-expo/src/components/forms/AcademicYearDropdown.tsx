/**
 * Reusable Academic Year Dropdown
 * Pre-populates with current academic year from the API.
 * Can be used in any form that needs academic year selection.
 */

import { useMemo } from 'react';

import { useCurrentAcademicYear } from '@/features/core';

import { FormDropdown } from './FormDropdown';

interface AcademicYearDropdownProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly error?: string;
}

export function AcademicYearDropdown({
  value,
  onChange,
  label = 'Academic Year',
  placeholder = 'Select academic year',
  required = false,
  error,
}: AcademicYearDropdownProps) {
  const { data: currentAcademicYear, isLoading } = useCurrentAcademicYear();

  const options = useMemo(() => {
    if (!currentAcademicYear) return [];

    // Build options from current academic year using public_id as value
    const opts = [{ label: currentAcademicYear.name, value: currentAcademicYear.public_id }];

    return opts;
  }, [currentAcademicYear]);

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
