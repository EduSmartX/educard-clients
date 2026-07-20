import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CriticalOperationOptions {
  title?: string;
  description?: string;
}

interface CriticalOperationState {
  isActive: boolean;
  title: string;
  description: string;
}

interface CriticalOperationContextValue {
  isCriticalOperationActive: boolean;
  beginCriticalOperation: (options?: CriticalOperationOptions) => void;
  endCriticalOperation: () => void;
}

const DEFAULT_TITLE = 'Processing request';
const DEFAULT_DESCRIPTION = 'Please wait until the operation completes.';

const CriticalOperationContext = createContext<CriticalOperationContextValue | null>(null);

export function CriticalOperationProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<CriticalOperationState>({
    isActive: false,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  });

  const beginCriticalOperation = useCallback((options?: CriticalOperationOptions) => {
    setState({
      isActive: true,
      title: options?.title ?? DEFAULT_TITLE,
      description: options?.description ?? DEFAULT_DESCRIPTION,
    });
  }, []);

  const endCriticalOperation = useCallback(() => {
    setState((current) => ({
      ...current,
      isActive: false,
    }));
  }, []);

  useEffect(() => {
    if (!state.isActive) {
      document.body.style.overflow = '';
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isActive]);

  const value = useMemo(
    () => ({
      isCriticalOperationActive: state.isActive,
      beginCriticalOperation,
      endCriticalOperation,
    }),
    [state.isActive, beginCriticalOperation, endCriticalOperation]
  );

  return (
    <CriticalOperationContext.Provider value={value}>
      {children}
      {state.isActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-xl">
            <LoadingSpinner size="xl" className="text-violet-600" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">{state.title}</p>
              <p className="text-sm text-slate-500">{state.description}</p>
            </div>
          </div>
        </div>
      )}
    </CriticalOperationContext.Provider>
  );
}

export function useCriticalOperation() {
  const context = useContext(CriticalOperationContext);

  if (!context) {
    throw new Error('useCriticalOperation must be used within CriticalOperationProvider');
  }

  return context;
}
