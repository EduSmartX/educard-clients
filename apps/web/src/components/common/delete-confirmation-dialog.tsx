/**
 * Reusable Delete Confirmation Dialog
 * Modern styled confirmation dialog for delete operations throughout the application
 */

import { Trash2 } from 'lucide-react';
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

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  description?: string;
  isDeleting?: boolean;
  deleteButtonText?: string;
  cancelButtonText?: string;
  isSoftDelete?: boolean; // New prop for soft delete
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Delete Item',
  itemName,
  description,
  isDeleting = false,
  deleteButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  isSoftDelete = false, // Default to hard delete
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="overflow-hidden border-0 p-0 rounded-2xl bg-white shadow-soft-xl">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 px-6 py-6">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>

          <AlertDialogHeader className="relative">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/15 p-3.5 backdrop-blur-sm">
                <Trash2 className="h-6 w-6 text-white" strokeWidth={2} />
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
          <AlertDialogDescription className="text-base text-slate-600 leading-relaxed">
            {description || (
              <>
                <div>
                  Are you sure you want to delete{' '}
                  {itemName && <strong className="text-slate-900 font-semibold">{itemName}</strong>}?
                </div>
                <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <span className={`mt-0.5 ${isSoftDelete ? 'text-blue-500' : 'text-amber-500'}`}>
                    {isSoftDelete ? (
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
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
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
                    )}
                  </span>
                  <span className={`text-sm ${isSoftDelete ? 'text-blue-600' : 'text-amber-700'}`}>
                    {isSoftDelete
                      ? 'You can restore this item from the "Deleted" tab if needed.'
                      : 'This action cannot be undone.'}
                  </span>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </div>

        {/* Footer */}
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100">
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="border-2 border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.98] transition-all duration-200 font-medium"
            >
              {cancelButtonText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl border-0 hover:from-rose-600 hover:to-red-700 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] disabled:opacity-50 transition-all duration-200 font-semibold"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteButtonText}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
