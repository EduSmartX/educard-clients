/**
 * Leave Allocation Form Page Component
 * Wrapper for create, edit, and view modes with navigation
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/app-config';
import { LeaveAllocationForm } from './leave-allocation-form';

interface LeaveAllocationFormPageProps {
  mode: 'create' | 'edit' | 'view';
  allocationId?: string;
}

export function LeaveAllocationFormPage({ mode, allocationId }: LeaveAllocationFormPageProps) {
  const navigate = useNavigate();

  const handleBackToList = () => {
    navigate(ROUTES.LEAVE.ALLOCATIONS);
  };

  const handleFormSuccess = () => {
    navigate(ROUTES.LEAVE.ALLOCATIONS);
  };

  // Validate ID for edit/view modes
  if (mode !== 'create' && !allocationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <p className="text-red-600 font-medium">Invalid allocation ID</p>
            <p className="text-sm text-gray-500 mt-2">
              The leave allocation you're looking for doesn't exist or the ID is invalid.
            </p>
          </div>
          <Button onClick={handleBackToList}>Return to Policies</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Policies
        </Button>

        {mode === 'view' && allocationId && (
          <Button
            onClick={() => navigate(`${ROUTES.LEAVE.ALLOCATIONS}/${allocationId}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Policy
          </Button>
        )}
      </div>

      {/* Form */}
      <LeaveAllocationForm
        mode={mode}
        allocationId={allocationId}
        onSuccess={handleFormSuccess}
        onCancel={handleBackToList}
      />
    </div>
  );
}
