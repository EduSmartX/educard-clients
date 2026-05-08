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

export function QuickActions({ title = 'Quick Actions', actions, className }: QuickActionsProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2 flex-1">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <div className={cn('p-2 rounded-lg', action.iconBgColor)}>
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
