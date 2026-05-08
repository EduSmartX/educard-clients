/**
 * Reactivate Confirmation Dialog Component
 * Modern styled dialog for confirming reactivation of soft-deleted records
 * Matches the visual style of DeleteConfirmationDialog
 */

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
import { RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ReactivateConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isReactivating?: boolean;
  error?: string | null;
}

export function ReactivateConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Reactivate Record',
  description,
  itemName,
  isReactivating = false,
  error = null,
}: ReactivateConfirmationDialogProps) {
  const defaultDescription = itemName
    ? `Are you sure you want to reactivate "${itemName}"? This will restore the record and make it active again.`
    : 'Are you sure you want to reactivate this record? This will restore the record and make it active again.';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden border-0 p-0 bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 px-6 py-6">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

          <AlertDialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-white">
                  {title}
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <AlertDialogDescription className="text-base text-gray-700">
            <div>{description || defaultDescription}</div>
            <div className="mt-3 flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <span className="text-sm text-green-600">
                This record will be restored and become active again.
              </span>
            </div>
          </AlertDialogDescription>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-green-50/30 to-emerald-50/30 px-6 py-4 border-t border-green-100">
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isReactivating}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 font-medium"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={isReactivating}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-700 hover:from-green-700 hover:to-emerald-700 hover:border-green-800 hover:shadow-lg hover:shadow-green-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-md transition-all duration-200 font-semibold"
            >
              {isReactivating ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reactivate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
