import { type LucideProps, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
  gradient?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-violet-600',
  iconBgColor = 'bg-violet-100',
  gradient,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl p-6 shadow-soft border border-border/50 hover:shadow-soft-lg transition-all duration-300 overflow-hidden',
        className
      )}
    >
      {/* Background gradient decoration */}
      <div className={cn(
        'absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-125',
        gradient || 'bg-gradient-to-br from-violet-500 to-purple-600'
      )} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
          {trend && (
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                trend.isPositive 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-600'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </div>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3.5 rounded-2xl transition-transform duration-300 group-hover:scale-110',
          iconBgColor
        )}>
          <Icon className={cn('h-6 w-6', iconColor)} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
