/**
 * Organization Queries
 * React Query hooks for fetching organization data
 */

import { useQuery } from '@tanstack/react-query';
import { getOrganization, getAcademicYears, getCurrentAcademicYear } from '../api/organization-api';

/**
 * Hook to fetch organization details
 */
export function useOrganization(publicId: string | undefined) {
  return useQuery({
    queryKey: ['organization', publicId],
    queryFn: () => getOrganization(publicId!),
    select: (data) => data.data,
    enabled: !!publicId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch all academic years for the organization
 */
export function useAcademicYears() {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: getAcademicYears,
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch current academic year for the organization
 */
export function useCurrentAcademicYear() {
  return useQuery({
    queryKey: ['current-academic-year'],
    queryFn: getCurrentAcademicYear,
    select: (data) => data.data,
  });
}

/**
 * Returns the academic year start/end dates as strings (YYYY-MM-DD).
 * Useful for constraining date pickers to the academic year range.
 */
export function useAcademicYearBounds() {
  const { data } = useCurrentAcademicYear();
  return {
    minDate: data?.start_date ?? undefined,
    maxDate: data?.end_date ?? undefined,
  };
}
