/**
 * Table View Component
 * Displays holidays in a sortable table format
 */

import { useMemo, useState } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/use-role';
import type { Holiday } from '../types';
import {
  sortHolidaysByDate,
  getHolidayTypeColor,
  formatHolidayType,
  calculateDuration,
  isHolidayPast,
  isWeekendHoliday,
} from '../utils/holiday-utils';
import { useDeleteHoliday } from '../hooks';
import { HolidayFormDialog } from './holiday-form-dialog';
import { DeleteConfirmationDialog } from '@/components/common/delete-confirmation-dialog';

interface TableViewProps {
  holidays: Holiday[];
  currentDate: Date;
}

export function TableView({ holidays, currentDate }: TableViewProps) {
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  // Get user role to determine if edit/delete actions should be shown
  const { role } = useRole();
  const isAdmin = role === 'ADMIN';
  
  const today = startOfDay(new Date());
  const deleteMutation = useDeleteHoliday();

  // Sort holidays by date
  const sortedHolidays = useMemo(() => {
    return sortHolidaysByDate(holidays);
  }, [holidays]);

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
    }
  };

  if (sortedHolidays.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600">No holidays found</p>
        <p className="text-sm text-gray-500 mt-1">for {format(currentDate, 'MMMM yyyy')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border-2 border-blue-100 shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-600">
              <TableHead className="text-center font-semibold text-white">Date</TableHead>
              <TableHead className="text-center font-semibold text-white">Description</TableHead>
              <TableHead className="text-center font-semibold text-white">Duration</TableHead>
              <TableHead className="text-center font-semibold text-white">Type</TableHead>
              {isAdmin && (
                <TableHead className="w-[120px] text-center font-semibold text-white">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHolidays.map((holiday, index) => {
              const colors = getHolidayTypeColor(holiday.holiday_type);
              const duration = calculateDuration(holiday.start_date, holiday.end_date);
              const isPast = isHolidayPast(holiday, today);
              const isWeekend = isWeekendHoliday(holiday);

              return (
                <TableRow
                  key={holiday.public_id}
                  className={cn(
                    isPast && 'opacity-60',
                    index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                  )}
                >
                  <TableCell className="text-center font-medium">
                    <div>
                      {format(parseISO(holiday.start_date), 'MMM dd, yyyy')}
                      {duration > 1 && (
                        <>
                          <br />
                          <span className="text-sm text-gray-500">
                            to {format(parseISO(holiday.end_date), 'MMM dd, yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className={cn(
                          'h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm',
                          colors.badge
                        )}
                      />
                      <span className="font-medium">{holiday.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 border border-gray-300"
                    >
                      {duration} {duration === 1 ? 'Day' : 'Days'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(colors.badge, 'border-0 shadow-sm')}>
                      {formatHolidayType(holiday.holiday_type)}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                          onClick={() => handleEdit(holiday)}
                          disabled={isWeekend || deleteMutation.isPending}
                          title={isWeekend ? 'Cannot edit weekend holidays' : 'Edit holiday'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleDelete(holiday)}
                          disabled={isWeekend || deleteMutation.isPending}
                          title={isWeekend ? 'Cannot delete weekend holidays' : 'Delete holiday'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
