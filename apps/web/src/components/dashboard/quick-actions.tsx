import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  iconColor: string;
  iconBgColor: string;
  onClick: () => void;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({
  title = 'Quick Actions',
  actions,
  className,
}: Readonly<QuickActionsProps>) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm',
        className
      )}
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="flex-1 space-y-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className="group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-50"
          >
            <div className={cn('rounded-lg p-2', action.iconBgColor)}>
              <action.icon className={cn('h-5 w-5', action.iconColor)} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
