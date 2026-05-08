/**
 * Date Action Dialog Component
 * Shown when clicking a date that has holidays
 * Allows editing, deleting, or adding more holidays
 */

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Holiday } from '../types';
import {
  getHolidayTypeColor,
  formatHolidayType,
  calculateDuration,
  filterNonWeekendHolidays,
} from '../utils/holiday-utils';
import { useDeleteHoliday } from '../hooks';
import { HolidayFormDialog } from './holiday-form-dialog';
import { DeleteConfirmationDialog } from '@/components/common/delete-confirmation-dialog';

interface DateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  holidays: Holiday[];
  onAddAnother: () => void;
}

export function DateActionDialog({
  open,
  onOpenChange,
  date,
  holidays,
  onAddAnother,
}: DateActionDialogProps) {
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const deleteMutation = useDeleteHoliday();
  const nonWeekendHolidays = filterNonWeekendHolidays(holidays);

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setEditDialogOpen(true);
  };

  const handleDelete = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (holidayToDelete) {
      deleteMutation.mutate(holidayToDelete.public_id);
      setDeleteDialogOpen(false);
      setHolidayToDelete(null);

      // Close main dialog if no more holidays remain
      const remainingHolidays = nonWeekendHolidays.filter(
        (h) => h.public_id !== holidayToDelete.public_id
      );
      if (remainingHolidays.length === 0) {
        onOpenChange(false);
      }
    }
  };

  if (!date) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl overflow-hidden border-0 p-0 bg-gradient-to-br from-amber-50 via-white to-orange-50">
          {/* Header with gradient background */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 px-6 py-8">
            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>

            <DialogHeader className="relative">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {format(date, 'MMMM dd, yyyy')}
                  </DialogTitle>
                  <DialogDescription className="text-amber-50 mt-1">
                    {nonWeekendHolidays.length === 0
                      ? 'No holidays on this date. Add one now!'
                      : `${nonWeekendHolidays.length} ${nonWeekendHolidays.length === 1 ? 'holiday' : 'holidays'} on this date`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content area */}
          <div className="overflow-y-auto max-h-[calc(90vh-280px)] px-6 py-6">
            <div className="space-y-4">
              {nonWeekendHolidays.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-dashed border-amber-200">
                  <div className="rounded-full bg-amber-100 p-4 w-fit mx-auto mb-4">
                    <CalendarIcon className="h-12 w-12 text-amber-600" />
                  </div>
                  <p className="text-gray-600 font-medium">No holidays on this date</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Add Holiday" to create one</p>
                </div>
              ) : (
                nonWeekendHolidays.map((holiday) => {
                  const colors = getHolidayTypeColor(holiday.holiday_type);
                  const duration = calculateDuration(holiday.start_date, holiday.end_date);

                  return (
                    <Card
                      key={holiday.public_id}
                      className="border-2 border-amber-100 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-amber-50/30"
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={cn('h-3 w-3 rounded-full shadow-sm', colors.badge)} />
                              <span className="text-base font-semibold text-gray-900">
                                {holiday.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarIcon className="h-4 w-4 text-amber-600" />
                              <span>
                                {format(parseISO(holiday.start_date), 'MMM dd, yyyy')}
                                {duration > 1 &&
                                  ` - ${format(parseISO(holiday.end_date), 'MMM dd, yyyy')}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-0 font-medium"
                              >
                                {duration} {duration === 1 ? 'Day' : 'Days'}
                              </Badge>
                              <Badge
                                className={cn(
                                  colors.badge,
                                  'text-xs px-3 py-1 border-0 font-medium shadow-sm'
                                )}
                              >
                                {formatHolidayType(holiday.holiday_type)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200"
                              onClick={() => handleEdit(holiday)}
                              disabled={deleteMutation.isPending}
                              title="Edit holiday"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-red-600 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-200"
                              onClick={() => handleDelete(holiday)}
                              disabled={deleteMutation.isPending}
                              title="Delete holiday"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer with gradient background */}
          <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 px-6 py-4 border-t border-amber-100">
            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                variant="brandOutline"
                onClick={() => onOpenChange(false)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                variant="brand"
                onClick={onAddAnother}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <HolidayFormDialog
        mode="edit"
        holiday={editingHoliday}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Holiday"
        itemName={holidayToDelete?.description}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
