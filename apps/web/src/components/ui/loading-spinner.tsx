import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export function LoadingSpinner({ size = 'md', className }: Readonly<LoadingSpinnerProps>) {
  return (
    <output
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizeClasses[size],
        className
      )}
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !border-0 !p-0 !whitespace-nowrap ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </output>
  );
}

export function PageLoader() {
  return (
    <div className="bg-gradient-mesh flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20"></div>
          <LoadingSpinner size="xl" className="relative text-violet-600" />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export function ComponentLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-violet-600" />
        <p className="text-xs text-slate-400">Loading content...</p>
      </div>
    </div>
  );
}
