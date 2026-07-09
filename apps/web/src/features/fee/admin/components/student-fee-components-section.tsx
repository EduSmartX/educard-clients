/**
 * Student Fee Components Section
 * Edit optional fee component selection and admin notes.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Lock, IndianRupee } from 'lucide-react';
import { ComponentApprovalStatus, type StudentFeeComponentItem } from '@educard/shared';

interface StudentFeeComponentsSectionProps {
  components: StudentFeeComponentItem[];
  componentSelections: Record<string, { is_selected: boolean; admin_note: string }>;
  isSaving: boolean;
  onSelectionChange: (componentPublicId: string, isSelected: boolean) => void;
  onAdminNoteChange: (componentPublicId: string, adminNote: string) => void;
  onSave: () => void;
}

export function StudentFeeComponentsSection({
  components,
  componentSelections,
  isSaving,
  onSelectionChange,
  onAdminNoteChange,
  onSave,
}: Readonly<StudentFeeComponentsSectionProps>) {
  const safeComponents = Array.isArray(components) ? components : [];

  const optionalComponentsCount = safeComponents.filter(
    (component) => component.component_type === 'optional'
  ).length;

  const pendingRequestCount = safeComponents.filter(
    (component) => component.approval_status === ComponentApprovalStatus.PENDING
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fee Components</CardTitle>
        <div className="text-muted-foreground text-sm">
          Optional components can be toggled on/off. Mandatory components are always included.
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">Optional: {optionalComponentsCount}</Badge>
          {pendingRequestCount > 0 && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              Pending parent requests: {pendingRequestCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {safeComponents.length === 0 && (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
            No fee components found for this student fee.
          </div>
        )}

        {safeComponents.map((component: StudentFeeComponentItem) => {
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
                        onSelectionChange(component.fee_component_public_id, checked)
                      }
                    />
                  )}
                  <div>
                    <div className="font-medium">{component.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={isMandatory ? 'secondary' : 'outline'} className="text-xs">
                        {isMandatory ? 'Mandatory' : 'Optional'}
                      </Badge>
                      {component.approval_status === ComponentApprovalStatus.PENDING && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          Pending
                        </Badge>
                      )}
                      {component.approval_status === ComponentApprovalStatus.REJECTED && (
                        <Badge variant="destructive" className="text-xs">
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-lg font-semibold">
                  <IndianRupee className="h-4 w-4" />
                  {Number(component.amount ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
              {!isMandatory && (
                <div className="space-y-1">
                  {!!component.request_note && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                      Parent note: {component.request_note}
                    </div>
                  )}
                  <Label className="text-muted-foreground text-xs">Admin Note (optional)</Label>
                  <Input
                    className="h-8 text-sm"
                    value={adminNote}
                    onChange={(e) =>
                      onAdminNoteChange(component.fee_component_public_id, e.target.value)
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
            variant="default"
            onClick={onSave}
            disabled={isSaving}
            className="min-w-36 gap-2 bg-green-600 text-white hover:bg-green-700"
          >
            {isSaving ? 'Saving...' : 'Save Components'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
