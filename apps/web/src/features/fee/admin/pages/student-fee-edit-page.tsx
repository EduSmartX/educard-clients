/**
 * Student Fee Edit Page
 * Allows admin to edit discount/referral fields and toggle optional fee components
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/app-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, IndianRupee, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { useStudentFee } from '../../hooks/use-fee-queries';
import { useUpdateStudentFee, useUpdateStudentFeeComponents } from '../../hooks/use-fee-mutations';
import type { StudentFeeComponentItem } from '@educard/shared';

export function StudentFeeEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
            onClick: () => navigate(ROUTES.FEES.STUDENT_FEES),
            variant: 'outline' as const,
          },
          {
            label: 'View Details',
            onClick: () => navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', id)),
            variant: 'outline' as const,
            icon: Pencil,
          },
        ]}
      />

      {/* Section 1: Discount & Referral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Discount & Referral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                min={0}
                max={100}
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_reason">Discount Reason</Label>
              <Input
                id="discount_reason"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="e.g. Sibling discount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral_name">Referral Name</Label>
              <Input
                id="referral_name"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="Referrer's name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral_code">Referral Code</Label>
              <Input
                id="referral_code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. REF2024"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveDiscount}
              disabled={updateStudentFee.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-32 gap-2"
            >
              {updateStudentFee.isPending ? 'Saving...' : 'Save Discount'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Fee Components */}
      {studentFee.components && studentFee.components.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentFee.components.map((component: StudentFeeComponentItem) => {
              const isMandatory = component.component_type === 'mandatory';
              const selection = componentSelections[component.fee_component_public_id];
              const isSelected = selection?.is_selected ?? component.is_selected;
              const adminNote = selection?.admin_note ?? '';

              return (
                <div
                  key={component.fee_component_public_id}
                  className="space-y-2 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isMandatory ? (
                        <Lock className="text-muted-foreground h-4 w-4" />
                      ) : (
                        <Switch
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            setComponentSelections((prev) => ({
                              ...prev,
                              [component.fee_component_public_id]: {
                                ...prev[component.fee_component_public_id],
                                is_selected: checked,
                              },
                            }))
                          }
                        />
                      )}
                      <div>
                        <div className="font-medium">{component.name}</div>
                        <Badge
                          variant={isMandatory ? 'secondary' : 'outline'}
                          className="mt-0.5 text-xs"
                        >
                          {isMandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center text-lg font-semibold">
                      <IndianRupee className="h-4 w-4" />
                      {component.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {!isMandatory && (
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Admin Note (optional)</Label>
                      <Input
                        className="h-8 text-sm"
                        value={adminNote}
                        onChange={(e) =>
                          setComponentSelections((prev) => ({
                            ...prev,
                            [component.fee_component_public_id]: {
                              ...prev[component.fee_component_public_id],
                              admin_note: e.target.value,
                            },
                          }))
                        }
                        placeholder="Reason for selecting/deselecting"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSaveComponents}
                disabled={updateComponents.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-36 gap-2"
              >
                {updateComponents.isPending ? 'Saving...' : 'Save Components'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
