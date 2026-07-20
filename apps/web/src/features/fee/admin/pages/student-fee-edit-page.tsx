/**
 * Student Fee Edit Page
 * Allows admin to edit discount/referral fields and toggle optional fee components
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants/app-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { useStudentFee } from '../../hooks/use-fee-queries';
import { useUpdateStudentFee, useUpdateStudentFeeComponents } from '../../hooks/use-fee-mutations';
import { type StudentFeeComponentItem } from '@educard/shared';
import { StudentFeeDiscountSection } from '../components/student-fee-discount-section';
import { StudentFeeComponentsSection } from '../components/student-fee-components-section';

export function StudentFeeEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeSection = searchParams.get('section') === 'components' ? 'components' : 'discount';

  const { data: studentFee, isLoading } = useStudentFee(id);
  const updateStudentFee = useUpdateStudentFee();
  const updateComponents = useUpdateStudentFeeComponents();

  // Discount/referral form state
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [referralName, setReferralName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  // Component selection state: map of fee_component_public_id → { is_selected, admin_note }
  const [componentSelections, setComponentSelections] = useState<
    Record<string, { is_selected: boolean; admin_note: string }>
  >({});

  // Populate form when data loads
  useEffect(() => {
    if (studentFee) {
      setDiscountPercentage(String(studentFee.discount_percentage ?? 0));
      setReferralName(studentFee.referral_name ?? '');
      setReferralCode(studentFee.referral_code ?? '');
      setDiscountReason(studentFee.discount_reason ?? '');

      if (studentFee.components) {
        const selections: Record<string, { is_selected: boolean; admin_note: string }> = {};
        studentFee.components.forEach((c: StudentFeeComponentItem) => {
          selections[c.fee_component_public_id] = {
            is_selected: c.is_selected,
            admin_note: c.admin_note ?? '',
          };
        });
        setComponentSelections(selections);
      }
    }
  }, [studentFee]);

  const handleSaveDiscount = () => {
    updateStudentFee.mutate({
      id,
      data: {
        discount_percentage: Number(discountPercentage),
        referral_name: referralName,
        referral_code: referralCode,
        discount_reason: discountReason,
      },
    });
  };

  const handleSaveComponents = () => {
    if (!studentFee?.components) {
      return;
    }
    const components = studentFee.components.map((c: StudentFeeComponentItem) => ({
      component_public_id: c.fee_component_public_id,
      is_selected: componentSelections[c.fee_component_public_id]?.is_selected ?? c.is_selected,
      admin_note: componentSelections[c.fee_component_public_id]?.admin_note ?? '',
    }));
    updateComponents.mutate(
      { id, data: { components } },
      {
        onSuccess: () => {
          navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', id));
        },
      }
    );
  };

  const handleComponentSelectionChange = (componentPublicId: string, isSelected: boolean) => {
    setComponentSelections((prev) => ({
      ...prev,
      [componentPublicId]: {
        ...prev[componentPublicId],
        is_selected: isSelected,
      },
    }));
  };

  const handleComponentAdminNoteChange = (componentPublicId: string, adminNote: string) => {
    setComponentSelections((prev) => ({
      ...prev,
      [componentPublicId]: {
        ...prev[componentPublicId],
        admin_note: adminNote,
      },
    }));
  };

  const handleSectionChange = (section: 'discount' | 'components') => {
    const nextSearch = new URLSearchParams(searchParams);
    nextSearch.set('section', section);
    setSearchParams(nextSearch, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!studentFee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Student fee record not found.</p>
        <Button variant="link" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Fee — ${studentFee.student_name}`}
        description={`${studentFee.class_name} • ${studentFee.fee_structure_name} • ${studentFee.academic_year}`}
        actions={[
          {
            label: 'Cancel',
            onClick: () => navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', id)),
            variant: 'outline' as const,
          },
          {
            label: 'View Details',
            onClick: () => navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', id)),
            variant: 'secondary' as const,
            icon: Pencil,
          },
        ]}
      />

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <Button
          size="sm"
          variant={activeSection === 'discount' ? 'default' : 'ghost'}
          onClick={() => handleSectionChange('discount')}
          className="rounded-lg"
        >
          Discount
        </Button>
        <Button
          size="sm"
          variant={activeSection === 'components' ? 'default' : 'ghost'}
          onClick={() => handleSectionChange('components')}
          className="rounded-lg"
        >
          Components
        </Button>
      </div>

      {activeSection === 'discount' && (
        <StudentFeeDiscountSection
          discountPercentage={discountPercentage}
          discountReason={discountReason}
          referralName={referralName}
          referralCode={referralCode}
          isSaving={updateStudentFee.isPending}
          onDiscountPercentageChange={setDiscountPercentage}
          onDiscountReasonChange={setDiscountReason}
          onReferralNameChange={setReferralName}
          onReferralCodeChange={setReferralCode}
          onSave={handleSaveDiscount}
        />
      )}

      {activeSection === 'components' && (
        <StudentFeeComponentsSection
          components={studentFee.components ?? []}
          componentSelections={componentSelections}
          isSaving={updateComponents.isPending}
          onSelectionChange={handleComponentSelectionChange}
          onAdminNoteChange={handleComponentAdminNoteChange}
          onSave={handleSaveComponents}
        />
      )}
    </div>
  );
}
