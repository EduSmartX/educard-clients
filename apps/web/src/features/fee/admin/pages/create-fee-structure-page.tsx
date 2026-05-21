/**
 * Create Fee Structure Page
 * Page for creating a new fee structure
 */

import { useNavigate } from 'react-router-dom';
import { FeeStructureForm } from '../components/fee-structure-form';
import { useCreateFeeStructure } from '../../hooks/use-fee-mutations';
import { useFeeStructures } from '../../hooks/use-fee-queries';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useAcademicYears, useCurrentAcademicYear } from '@/features/organizations/hooks/queries';
import type { FeeStructureCreatePayload } from '@educard/shared';
import { ROUTES } from '@/constants/app-config';

export function CreateFeeStructurePage() {
  const navigate = useNavigate();

  // Data for form
  const { data: classesData } = useClasses();
  const { data: academicYearsData } = useAcademicYears();
  const { data: currentAcademicYear } = useCurrentAcademicYear();
  const { data: existingStructures } = useFeeStructures();

  // Mutation
  const createMutation = useCreateFeeStructure();

  const handleSubmit = (data: FeeStructureCreatePayload) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate(ROUTES.FEES.STRUCTURES);
      },
    });
  };

  const classesArray = classesData?.data || [];
  const classes = classesArray.map((cls) => ({
    public_id: cls.public_id,
    name: cls.name,
    section: cls.section,
    master_class: cls.class_master?.name,
    display_name: cls.display_name,
  }));

  // Get class IDs that already have an active fee structure
  const classesWithActiveFeeStructure = new Set<string>();
  const structures = existingStructures?.data ?? [];
  (structures as Array<{ is_active?: boolean; class_public_ids?: string[] }>).forEach(
    (structure) => {
      if (structure.is_active && structure.class_public_ids) {
        structure.class_public_ids.forEach((id: string) => classesWithActiveFeeStructure.add(id));
      }
    }
  );

  // Only show classes that don't have an active fee structure
  const availableClasses = classes.filter(
    (cls) => !classesWithActiveFeeStructure.has(cls.public_id)
  );

  // Academic years list
  const academicYears = academicYearsData?.length
    ? academicYearsData.map((ay: { name: string }) => ay.name)
    : ['2024-2025', '2025-2026', '2026-2027'];

  // Default academic year from current active year
  const defaultAcademicYear = currentAcademicYear?.name || '';

  return (
    <div className="space-y-6">
      <FeeStructureForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        classes={availableClasses}
        academicYears={academicYears}
        defaultAcademicYear={defaultAcademicYear}
        apiError={createMutation.error}
      />
    </div>
  );
}
