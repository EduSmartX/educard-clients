import type { ReactNode } from 'react';

interface HeaderActionRowsProps {
  primaryAction?: ReactNode;
  topRightAction?: ReactNode;
  secondaryActions?: ReactNode;
  className?: string;
}

export function HeaderActionRows({
  primaryAction,
  topRightAction,
  secondaryActions,
  className,
}: Readonly<HeaderActionRowsProps>) {
  const useSingleRow = !primaryAction && !!secondaryActions;

  // Rows stack full-width one-per-line on mobile, then wrap right-aligned at sm+.
  const rowClass =
    'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto';

  return (
    <div className={className ?? 'flex flex-col gap-2'}>
      <div className={rowClass}>
        {primaryAction}
        {topRightAction}
        {useSingleRow ? secondaryActions : null}
      </div>
      {!!secondaryActions && !useSingleRow && <div className={rowClass}>{secondaryActions}</div>}
    </div>
  );
}
