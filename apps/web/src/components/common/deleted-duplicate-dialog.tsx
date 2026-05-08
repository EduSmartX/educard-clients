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
              <span key={index} className="font-bold text-gray-900">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px] bg-white p-0 gap-0 rounded-xl border shadow-xl overflow-hidden">
        {/* Header with Icon */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 px-6 py-5 border-b border-orange-100">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold text-gray-900 m-0">
                {title}
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <AlertDialogDescription className="text-[15px] text-gray-600 leading-relaxed" asChild>
            <p>{renderMessage()}</p>
          </AlertDialogDescription>
        </div>

        {/* Footer with Actions */}
        <AlertDialogFooter className="px-6 py-4 bg-gray-50 border-t flex-col sm:flex-col gap-2.5 space-x-0">
          <Button
            onClick={handleReactivate}
            size="lg"
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-sm transition-colors rounded-lg"
          >
            {reactivateLabel}
          </Button>
          <Button
            onClick={handleCreateNew}
            size="lg"
            variant="outline"
            className="w-full h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold text-base transition-colors rounded-lg"
          >
            {createNewLabel}
          </Button>
          <AlertDialogCancel asChild onClick={handleCancel}>
            <Button
              size="lg"
              variant="ghost"
              className="w-full h-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium text-base mt-0 transition-colors rounded-lg"
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
