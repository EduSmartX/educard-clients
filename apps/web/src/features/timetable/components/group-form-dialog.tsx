/**
 * Create / Edit Class Group Dialog
 */

import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateClassGroup, useUpdateClassGroup } from '../hooks/mutations';
import { CLASS_GROUP_STRINGS as S } from '../constants/class-group-strings';
import type { ClassGroup } from '../types';

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editGroup?: ClassGroup | null;
}

export function GroupFormDialog({ open, onOpenChange, editGroup }: GroupFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const createMutation = useCreateClassGroup();
  const updateMutation = useUpdateClassGroup();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setName(editGroup?.name ?? '');
      setDescription(editGroup?.description ?? '');
      setDisplayOrder(editGroup?.display_order ?? 0);
    }
  }, [open, editGroup]);

  const handleSubmit = useCallback(() => {
    const data = { name, description, display_order: displayOrder };
    if (editGroup) {
      updateMutation.mutate(
        { publicId: editGroup.public_id, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  }, [name, description, displayOrder, editGroup, updateMutation, createMutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <Users className="h-4 w-4" />
            </div>
            {editGroup ? S.EDIT_DIALOG_TITLE : S.CREATE_DIALOG_TITLE}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="group-name">{S.LABEL_GROUP_NAME}</Label>
            <Input
              id="group-name"
              placeholder={S.PLACEHOLDER_GROUP_NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="group-desc">
              {S.LABEL_DESCRIPTION}{' '}
              <span className="text-slate-400">{S.LABEL_DESCRIPTION_HINT}</span>
            </Label>
            <Input
              id="group-desc"
              placeholder={S.PLACEHOLDER_DESCRIPTION}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="group-order">{S.LABEL_DISPLAY_ORDER}</Label>
            <Input
              id="group-order"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="mt-1 w-24"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {S.BUTTON_CANCEL}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? S.BUTTON_SAVING : editGroup ? S.BUTTON_UPDATE : S.BUTTON_CREATE_GROUP}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
