/**
 * Empty state for store screens: a line-art cart with a question mark and a gear,
 * a short title and explanation, and an optional action.
 */
import { Fragment } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_NAME } from '@/constants/app-config';

function CartIllustration({ className }: { className?: string }) {
  const teeth = Array.from({ length: 8 }, (_, index) => index * 45);
  return (
    <svg
      viewBox="0 0 160 124"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="An empty shopping cart"
    >
      {/* cart */}
      <path d="M8 22h20l14 58h64l12-40H34" />
      <path d="M50 40l5 40M72 40l2 40M94 40l-3 40" strokeWidth="2.2" />
      <circle cx="54" cy="98" r="7" />
      <circle cx="102" cy="98" r="7" />
      {/* question mark */}
      <circle cx="74" cy="58" r="11" strokeWidth="2.4" className="fill-background" />
      <path d="M70 55a4.5 4.5 0 1 1 6.4 4c-1.6.9-2.4 1.6-2.4 3.2" strokeWidth="2.4" />
      <path d="M74 66.5v.2" strokeWidth="3" />
      {/* gear */}
      <g transform="translate(130 24)">
        {teeth.map((angle) => (
          <path key={angle} d="M0 -14v-4" strokeWidth="4.5" transform={`rotate(${angle})`} />
        ))}
        <circle r="11" />
        <circle r="4.2" />
      </g>
    </svg>
  );
}

interface StoreEmptyStateProps {
  title: string;
  /** Plain text; "{company}" is replaced by the company name, shown bold and highlighted. */
  description: string;
  action?: { label: string; icon?: LucideIcon; onClick: () => void };
}

/** Company name (from VITE_COMPANY_NAME) in bold, tinted text. */
function Company() {
  return <strong className="font-bold text-violet-600 dark:text-violet-400">{COMPANY_NAME}</strong>;
}

function Description({ text }: { text: string }) {
  const parts = text.split('{company}');
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 && <Company />}
        </Fragment>
      ))}
    </>
  );
}

export function StoreEmptyState({ title, description, action }: StoreEmptyStateProps) {
  const ActionIcon = action?.icon;
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
      <CartIllustration className="text-foreground h-32 w-40" />
      <p className="mt-6 text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        <Description text={description} />
      </p>
      {action && (
        <Button
          variant="outline"
          className="mt-6 border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/50"
          onClick={action.onClick}
        >
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" aria-hidden />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
