/**
 * Class Groups Tab — Orchestrates group CRUD with card layout
 */

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassGroups } from '../hooks/queries';
import { CLASS_GROUP_STRINGS as S } from '../constants/class-group-strings';
import { GroupFormDialog } from './group-form-dialog';
import { GroupCard } from './group-card';
import type { ClassGroup } from '../types';

export function ClassGroupsTab() {
  const { data: groups, isLoading } = useClassGroups();
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<ClassGroup | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{S.TAB_TITLE}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{S.TAB_DESCRIPTION}</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          size="lg"
          className="bg-emerald-600 shadow-md hover:bg-emerald-700"
        >
          <Plus className="mr-1.5 h-4 w-4" /> {S.BUTTON_NEW_GROUP}
        </Button>
      </div>

      {!groups || groups.length === 0 ? (
        <div className="mx-auto max-w-lg">
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 px-8 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
              <Users className="h-10 w-10" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-800">{S.EMPTY_TITLE}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              {S.EMPTY_DESCRIPTION}
            </p>
            <Button
              size="lg"
              className="mt-6 bg-emerald-600 shadow-md hover:bg-emerald-700"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {S.BUTTON_CREATE_FIRST_GROUP}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, idx) => (
            <GroupCard
              key={group.public_id}
              group={group}
              colorIdx={idx}
              onEdit={(g) => setEditGroup(g)}
            />
          ))}
        </div>
      )}

      <GroupFormDialog open={showCreate} onOpenChange={(open) => setShowCreate(open)} />

      {editGroup && (
        <GroupFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditGroup(null);
            }
          }}
          editGroup={editGroup}
        />
      )}
    </div>
  );
}
