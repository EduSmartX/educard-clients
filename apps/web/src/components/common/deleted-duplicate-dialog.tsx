/**
 * Deleted Duplicate Dialog Component
 * Reusable dialog for handling deleted duplicate record scenarios
 * Shows options to Reactivate, Create New, or Cancel
 */

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface DeletedDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onReactivate: () => void;
  onCreateNew: () => void;
  onCancel?: () => void;
  reactivateLabel?: string;
  createNewLabel?: string;
  cancelLabel?: string;
  title?: string;
}

export function DeletedDuplicateDialog({
  open,
  onOpenChange,
  message,
  onReactivate,
  onCreateNew,
  onCancel,
  reactivateLabel = 'Reactivate Existing',
  createNewLabel = 'Create New Anyway',
  cancelLabel = 'Cancel',
  title = 'Duplicate Record Found',
}: DeletedDuplicateDialogProps) {
  const handleReactivate = () => {
    onOpenChange(false);
    onReactivate();
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    onCreateNew();
  };

  const handleCancel = () => {
    onOpenChange(false);
    if (onCancel) {
      onCancel();
    }
  };

  // Parse message to highlight employee ID or any quoted text
  const renderMessage = () => {
    // Match text within single quotes like 'EMP1111'
    const parts = message.split(/('.*?')/g);

    return (
      <span>
        {parts.map((part, index) => {
          // If the part is wrapped in quotes, make it bold
          if (part.startsWith("'") && part.endsWith("'")) {
            return (
              <span key={`part-${index}-${part}`} className="font-bold text-gray-900">
                {part}
              </span>
            );
          }
          return <span key={`part-${index}-${part}`}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-0 overflow-hidden rounded-xl border bg-white p-0 shadow-xl sm:max-w-[480px]">
        {/* Header with Icon */}
        <div className="border-b border-orange-100 bg-gradient-to-br from-orange-50 to-red-50 px-6 py-5">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <AlertDialogTitle className="m-0 text-xl font-semibold text-gray-900">
                {title}
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <AlertDialogDescription className="text-[15px] leading-relaxed text-gray-600" asChild>
            <p>{renderMessage()}</p>
          </AlertDialogDescription>
        </div>

        {/* Footer with Actions */}
        <AlertDialogFooter className="flex-col gap-2.5 space-x-0 border-t bg-gray-50 px-6 py-4 sm:flex-col">
          <Button
            onClick={handleReactivate}
            size="lg"
            className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {reactivateLabel}
          </Button>
          <Button
            onClick={handleCreateNew}
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-lg border-2 border-gray-300 text-base font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100"
          >
            {createNewLabel}
          </Button>
          <AlertDialogCancel asChild onClick={handleCancel}>
            <Button
              size="lg"
              variant="ghost"
              className="mt-0 h-12 w-full rounded-lg text-base font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
