/**
 * Edit Fee Structure Page
 * Page for editing an existing fee structure with impact preview
 */

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertTriangle,
  Ban,
  IndianRupee,
  Info,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Component,
} from 'lucide-react';
import { FeeStructureForm } from '../components/fee-structure-form';
import { useFeeStructure } from '../../hooks/use-fee-queries';
import { useUpdateFeeStructure } from '../../hooks/use-fee-mutations';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useAcademicYears } from '@/features/organizations/hooks/queries';
import {
  createFeeStructureApi,
  FEE_UI_TEXT,
  type FeeStructureCreatePayload,
  type ClassChangeImpact,
} from '@educard/shared';
import { ROUTES } from '@/constants/app-config';
import apiClient from '@/lib/api';
import { PageHeader } from '@/components/common';

// Impact messages for user clarity
const IMPACT_MESSAGES = {
  TITLE: 'Confirm Changes — Student Fee Impact',
  SUBTITLE: 'Please review the following changes before proceeding:',
  // Class changes
  CLASSES_ADDED: (count: number) =>
    `${count} new student${count > 1 ? 's' : ''} will be assigned this fee automatically.`,
  CLASSES_REMOVED_UNPAID: (count: number) =>
    `${count} unpaid fee record${count > 1 ? 's' : ''} will be permanently removed.`,
  CLASSES_REMOVED_PAID: (count: number) =>
    `${count} partially/fully paid record${count > 1 ? 's' : ''} will be marked as "Cancelled". You'll need to review refunds manually.`,
  REFUND_AMOUNT: (amount: string) =>
    `₹${Number.parseFloat(amount).toLocaleString('en-IN')} has already been collected from these students. Refund processing will be required.`,
  // Component/Amount changes
  AMOUNT_INCREASED: (oldAmt: number, newAmt: number) =>
    `Total fee increased from ₹${oldAmt.toLocaleString('en-IN')} → ₹${newAmt.toLocaleString('en-IN')}. All student balances will increase accordingly.`,
  AMOUNT_DECREASED: (oldAmt: number, newAmt: number) =>
    `Total fee decreased from ₹${oldAmt.toLocaleString('en-IN')} → ₹${newAmt.toLocaleString('en-IN')}. Student balances will be reduced. Overpaid students will show negative balance.`,
  COMPONENTS_CHANGED:
    'Fee components have been modified. The updated breakdown will reflect on all student fee records.',
  // General
  BALANCE_RECALC:
    'Balance Due = New Total − Discount − Amount Already Paid. No existing payments will be deleted.',
  CANNOT_UNDO: 'This action cannot be undone. Please proceed carefully.',
  NO_IMPACT: 'No student fee records are affected by these changes.',
} as const;

export function EditFeeStructurePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const feeStructureApi = createFeeStructureApi(apiClient);

  // Fetch existing structure
  const { data: structure, isLoading: isStructureLoading } = useFeeStructure(id);

  // Data for form
  const { data: classesData } = useClasses();
  const { data: academicYearsData } = useAcademicYears();

  // Mutation
  const updateMutation = useUpdateFeeStructure();

  // Impact preview state
  const [pendingData, setPendingData] = useState<FeeStructureCreatePayload | null>(null);
  const [impact, setImpact] = useState<ClassChangeImpact | null>(null);
  const [changeType, setChangeType] = useState<{
    classesChanged: boolean;
    amountChanged: boolean;
    componentsChanged: boolean;
    amountIncreased: boolean;
    oldAmount: number;
    newAmount: number;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCheckingImpact, setIsCheckingImpact] = useState(false);

  const handleSubmit = async (data: FeeStructureCreatePayload) => {
    if (!id || !structure) {
      return;
    }

    // Detect class changes
    const currentClassIds = structure.class_public_ids || [];
    const newClassIds = data.class_public_ids || [];
    const classesChanged =
      currentClassIds.length !== newClassIds.length ||
      !currentClassIds.every((cid) => newClassIds.includes(cid));

    // Detect amount change
    const oldAmount = structure.total_amount || 0;
    const newAmount = data.total_amount || 0;
    const amountChanged =
      Math.abs(Number.parseFloat(String(oldAmount)) - Number.parseFloat(String(newAmount))) > 0.001;

    // Detect component changes — compare only name/amount/component_type, sorted by name
    const normalise = (
      comps: { name: string; amount: number | string; component_type?: string }[]
    ) =>
      [...comps]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(
          (c) =>
            `${c.name}|${Number.parseFloat(String(c.amount)).toFixed(2)}|${c.component_type ?? ''}`
        )
        .join(',');
    const componentsChanged =
      normalise(structure.components || []) !== normalise(data.components || []);

    if (classesChanged || amountChanged || componentsChanged) {
      // Fetch impact preview for class changes
      setIsCheckingImpact(true);
      try {
        const impactData = await feeStructureApi.classChangeImpact(id, newClassIds);
        setImpact(impactData);
      } catch {
        setImpact(null);
      }
      setChangeType({
        classesChanged,
        amountChanged,
        componentsChanged,
        amountIncreased: newAmount > oldAmount,
        oldAmount,
        newAmount,
      });
      setPendingData(data);
      setShowConfirmDialog(true);
      setIsCheckingImpact(false);
    } else {
      // No impactful changes (name, description, due_date only), just update
      doUpdate(data);
    }
  };

  const doUpdate = (data: FeeStructureCreatePayload) => {
    if (!id) {
      return;
    }
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          navigate(ROUTES.FEES.STRUCTURES);
        },
      }
    );
  };

  const handleConfirmUpdate = () => {
    if (pendingData) {
      doUpdate(pendingData);
    }
    setShowConfirmDialog(false);
    setPendingData(null);
    setImpact(null);
    setChangeType(null);
  };

  // Transform classes data for the form
  const classesArray = classesData?.data || [];
  const classes = classesArray.map((cls) => ({
    public_id: cls.public_id,
    name: cls.name,
    section: cls.section,
    master_class: cls.class_master?.name,
    display_name: cls.display_name,
  }));

  // Academic years list
  const academicYears = academicYearsData?.length
    ? academicYearsData.map((ay: { name: string }) => ay.name)
    : ['2024-2025', '2025-2026', '2026-2027'];

  if (isStructureLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold">Fee Structure Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The fee structure you're looking for doesn't exist.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={ROUTES.FEES.STRUCTURES}>Back to Structures</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={FEE_UI_TEXT.FORM.EDIT_STRUCTURE}
        description={`Editing: ${structure.name}`}
        actions={[
          {
            label: 'Back to Structures',
            onClick: () => navigate(ROUTES.FEES.STRUCTURES),
            variant: 'outline' as const,
          },
        ]}
      />

      {/* Info Banner */}
      <Alert variant="default" className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>Note:</strong> Changing classes, components, or total amount will automatically
          update all linked student fee records. Students who have already made payments will retain
          their paid amounts — only the balance due will be recalculated.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <FeeStructureForm
        initialData={structure}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending || isCheckingImpact}
        classes={classes}
        academicYears={academicYears}
        apiError={updateMutation.error}
      />

      {/* Impact Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg border-amber-200 bg-white text-slate-900 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              {IMPACT_MESSAGES.TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-2">
                <p className="font-medium text-slate-800">{IMPACT_MESSAGES.SUBTITLE}</p>

                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {/* Component Changes */}
                  {changeType?.componentsChanged && (
                    <div className="flex items-start gap-2 text-sm">
                      <Component className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                      <span>{IMPACT_MESSAGES.COMPONENTS_CHANGED}</span>
                    </div>
                  )}

                  {/* Amount Changes */}
                  {changeType?.amountChanged && (
                    <div className="flex items-start gap-2 text-sm">
                      <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span>
                        {changeType.amountIncreased
                          ? IMPACT_MESSAGES.AMOUNT_INCREASED(
                              changeType.oldAmount,
                              changeType.newAmount
                            )
                          : IMPACT_MESSAGES.AMOUNT_DECREASED(
                              changeType.oldAmount,
                              changeType.newAmount
                            )}
                      </span>
                    </div>
                  )}

                  {/* Classes Added */}
                  {impact && impact.students_will_be_assigned > 0 && (
                    <div className="flex items-start gap-2 text-sm text-green-700">
                      <PlusCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{IMPACT_MESSAGES.CLASSES_ADDED(impact.students_will_be_assigned)}</span>
                    </div>
                  )}

                  {/* Unpaid fees removed */}
                  {impact && impact.unpaid_fees_will_be_deleted > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                      <span>
                        {IMPACT_MESSAGES.CLASSES_REMOVED_UNPAID(impact.unpaid_fees_will_be_deleted)}
                      </span>
                    </div>
                  )}

                  {/* Paid fees cancelled */}
                  {impact && impact.paid_fees_will_be_cancelled > 0 && (
                    <div className="flex items-start gap-2 text-sm font-medium text-red-700">
                      <Ban className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {IMPACT_MESSAGES.CLASSES_REMOVED_PAID(impact.paid_fees_will_be_cancelled)}
                      </span>
                    </div>
                  )}

                  {/* Refund amount */}
                  {impact && Number.parseFloat(impact.total_paid_amount_affected) > 0 && (
                    <div className="flex items-start gap-2 rounded bg-red-50 p-2 text-sm font-medium text-red-700">
                      <IndianRupee className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {IMPACT_MESSAGES.REFUND_AMOUNT(impact.total_paid_amount_affected)}
                      </span>
                    </div>
                  )}

                  {/* Balance recalculation note */}
                  {(changeType?.amountChanged || changeType?.componentsChanged) && (
                    <div className="mt-2 flex items-start gap-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{IMPACT_MESSAGES.BALANCE_RECALC}</span>
                    </div>
                  )}

                  {/* No impact scenario */}
                  {!changeType?.classesChanged &&
                    !changeType?.amountChanged &&
                    !changeType?.componentsChanged && (
                      <p className="text-sm text-slate-600">{IMPACT_MESSAGES.NO_IMPACT}</p>
                    )}
                </div>

                <p className="text-sm font-semibold text-red-600">
                  ⚠️ {IMPACT_MESSAGES.CANNOT_UNDO}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              I Understand, Update Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
