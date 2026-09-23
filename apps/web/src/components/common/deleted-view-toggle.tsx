import { Trash2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface DeletedViewToggleProps {
  showDeleted: boolean;
  onToggle: () => void;
  resourceName?: string;
  className?: string;
}

export function DeletedViewToggle({
  showDeleted,
  onToggle,
  resourceName: _resourceName = 'items',
  className,
}: DeletedViewToggleProps) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button
        onClick={onToggle}
        variant={showDeleted ? 'default' : 'outline'}
        className={
          showDeleted
            ? `w-full border-0 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-md transition-all duration-200 hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg [&>*]:!text-white ${className || ''}`
            : `w-full shadow-sm transition-all duration-200 hover:shadow-md ${className || ''}`
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {showDeleted ? (
            <motion.span
              key="active"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              <span className="sm:hidden">Active</span>
              <span className="hidden sm:inline">View Active</span>
            </motion.span>
          ) : (
            <motion.span
              key="deleted"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              <span className="sm:hidden">Deleted</span>
              <span className="hidden sm:inline">View Deleted</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}
