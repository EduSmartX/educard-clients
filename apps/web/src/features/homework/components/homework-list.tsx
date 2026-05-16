/**
 * Homework List Component
 * Displays a grid of homework cards with filtering
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { HomeworkCard } from './homework-card';
import type { Homework } from '../types';

interface HomeworkListProps {
  homework: Homework[];
  isLoading?: boolean;
  onView?: (homework: Homework) => void;
  onEdit?: (homework: Homework) => void;
  onDelete?: (homework: Homework) => void;
  onPublish?: (homework: Homework) => void;
  onArchive?: (homework: Homework) => void;
  onCreateNew?: () => void;
  emptyMessage?: string;
  showActions?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function HomeworkSkeleton() {
  return (
    <div className="rounded-2xl border-0 bg-white p-5 shadow-md dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-full" />
      <div className="mt-4 flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-4 h-2 w-full rounded-full" />
      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

function EmptyState({ message, onCreateNew }: { message: string; onCreateNew?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 dark:border-slate-700 dark:bg-slate-900/50"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <BookOpen className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
        No Homework Found
      </h3>
      <p className="mb-6 max-w-sm text-center text-sm text-slate-500">{message}</p>
      {onCreateNew && (
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Homework
        </Button>
      )}
    </motion.div>
  );
}

export const HomeworkList = memo(
  ({
    homework,
    isLoading = false,
    onView,
    onEdit,
    onDelete,
    onPublish,
    onArchive,
    onCreateNew,
    emptyMessage = 'No homework assignments found. Create your first homework to get started.',
    showActions = true,
  }: HomeworkListProps) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <HomeworkSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (homework.length === 0) {
      return <EmptyState message={emptyMessage} onCreateNew={onCreateNew} />;
    }

    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {homework.map((hw) => (
            <motion.div key={hw.public_id} variants={item} layout>
              <HomeworkCard
                homework={hw}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onPublish={onPublish}
                onArchive={onArchive}
                showActions={showActions}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }
);

export default HomeworkList;
