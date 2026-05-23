/**
 * Reusable Warning Confirmation Dialog
 * Modern styled confirmation dialog for warning operations throughout the application
 * Used when an action can proceed but user should be aware of potential issues
 */

import { AlertTriangle } from 'lucide-react';
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

interface WarningConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string | React.ReactNode;
  warningText?: string;
  isLoading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  /** Optional secondary action (appears between Cancel and Confirm) */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function WarningConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Warning',
  description,
  warningText,
  isLoading = false,
  confirmButtonText = 'Continue Anyway',
  cancelButtonText = 'Go Back',
  secondaryAction,
}: WarningConfirmationDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="shadow-soft-xl overflow-hidden rounded-2xl border-0 bg-white p-0">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-6">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>

          <AlertDialogHeader className="relative">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6 text-white" strokeWidth={2} />
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
          <AlertDialogDescription asChild>
            <div className="text-base leading-relaxed text-slate-600">
              {typeof description === 'string' ? <p>{description}</p> : description}
              {!!warningText && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <span className="mt-0.5 text-amber-500">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </span>
                  <span className="text-sm text-amber-800">{warningText}</span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-xl border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {cancelButtonText}
          </AlertDialogCancel>
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              disabled={isLoading}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              {secondaryAction.label}
            </Button>
          )}
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : confirmButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
