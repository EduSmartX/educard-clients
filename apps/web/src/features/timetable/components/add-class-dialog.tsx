/**
 * Add Class to Group Dialog
 */

import { useState, useMemo, useCallback } from 'react';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddClassToGroup } from '../hooks/mutations';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { CLASS_GROUP_STRINGS as S } from '../constants/class-group-strings';

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupPublicId: string;
  existingClassIds: Set<string>;
}

export function AddClassDialog({
  open,
  onOpenChange,
  groupPublicId,
  existingClassIds,
}: AddClassDialogProps) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
    is_deleted: false,
  });
  const addMutation = useAddClassToGroup();

  const availableClasses = useMemo(
    () => (classesData?.data ?? []).filter((cls) => !existingClassIds.has(cls.public_id)),
    [classesData?.data, existingClassIds]
  );

  const handleAdd = useCallback(() => {
    if (!selectedClassId) {
      return;
    }
    addMutation.mutate(
      { groupPublicId, classPublicId: selectedClassId },
      {
        onSuccess: () => {
          setSelectedClassId('');
          onOpenChange(false);
        },
      }
    );
  }, [selectedClassId, addMutation, groupPublicId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-500" />
            {S.ADD_CLASS_DIALOG_TITLE}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {classesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : availableClasses.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-500">{S.ALL_CLASSES_ASSIGNED}</p>
            </div>
          ) : (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder={S.PLACEHOLDER_SELECT_CLASS} />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map((cls) => (
                  <SelectItem key={cls.public_id} value={cls.public_id}>
                    {cls.class_master?.name} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {S.BUTTON_CANCEL}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedClassId || addMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {addMutation.isPending ? S.BUTTON_ADDING : S.BUTTON_ADD_CLASS}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
