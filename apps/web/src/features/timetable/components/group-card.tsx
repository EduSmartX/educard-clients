/**
 * Single Class Group Card with class badges, edit/delete actions
 */

import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, X, Pencil, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/common';
import { useDeleteClassGroup, useRemoveClassFromGroup } from '../hooks/mutations';
import { GROUP_COLORS } from '../constants/group-colors';
import { CLASS_GROUP_STRINGS as S } from '../constants/class-group-strings';
import { AddClassDialog } from './add-class-dialog';
import type { ClassGroup, ClassGroupMapping } from '../types';

interface GroupCardProps {
  group: ClassGroup;
  colorIdx: number;
  onEdit: (group: ClassGroup) => void;
}

export function GroupCard({ group, colorIdx, onEdit }: GroupCardProps) {
  const [showAddClass, setShowAddClass] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useDeleteClassGroup();
  const removeMutation = useRemoveClassFromGroup();
  const colors = GROUP_COLORS[colorIdx % GROUP_COLORS.length];

  const existingClassIds = useMemo(
    () => new Set((group.classes ?? []).map((c: ClassGroupMapping) => c.class_public_id)),
    [group.classes]
  );

  const handleRemoveClass = useCallback(
    (classPublicId: string) => {
      removeMutation.mutate({
        groupPublicId: group.public_id,
        classPublicId,
      });
    },
    [removeMutation, group.public_id]
  );

  const handleDeleteConfirm = useCallback(() => {
    deleteMutation.mutate(group.public_id, {
      onSuccess: () => setShowDeleteConfirm(false),
    });
  }, [deleteMutation, group.public_id]);

  const classList = group.classes ?? [];

  return (
    <>
      <Card className="group overflow-hidden rounded-2xl border-0 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className={`bg-gradient-to-r ${colors.bg} px-5 py-4`}>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-white">{group.name}</h3>
              {group.description && (
                <p className="mt-0.5 truncate text-xs text-white/75">{group.description}</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 rounded-lg p-0 text-white/80 hover:bg-white/20 hover:text-white"
                onClick={() => onEdit(group)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 rounded-lg p-0 text-white/80 hover:bg-red-500/30 hover:text-white"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge className="border-0 bg-white/20 text-xs text-white">
              {group.class_count} {group.class_count === 1 ? 'class' : 'classes'}
            </Badge>
            <Badge className="border-0 bg-white/20 text-xs text-white">
              Order: {group.display_order}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {S.LABEL_ASSIGNED_CLASSES}
          </p>
          <div className="mb-4 flex min-h-[40px] flex-wrap gap-2">
            {classList.length === 0 ? (
              <p className="py-1 text-xs text-slate-400 italic">{S.EMPTY_CLASSES}</p>
            ) : (
              classList.map((mapping: ClassGroupMapping) => (
                <Badge
                  key={mapping.public_id}
                  variant="outline"
                  className={`gap-1.5 rounded-lg border px-2.5 py-1.5 whitespace-nowrap ${colors.badge}`}
                >
                  <GraduationCap className="h-3 w-3 shrink-0" />
                  {mapping.class_name}
                  <button
                    className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-black/10"
                    onClick={() => handleRemoveClass(mapping.class_public_id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-lg border-dashed text-xs font-medium"
            onClick={() => setShowAddClass(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> {S.BUTTON_ADD_CLASS}
          </Button>
        </CardContent>
      </Card>

      <AddClassDialog
        open={showAddClass}
        onOpenChange={setShowAddClass}
        groupPublicId={group.public_id}
        existingClassIds={existingClassIds}
      />

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        title={S.DELETE_DIALOG_TITLE}
        itemName={group.name}
        isDeleting={deleteMutation.isPending}
        isSoftDelete={false}
      />
    </>
  );
}
