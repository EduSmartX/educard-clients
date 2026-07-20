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

  return (
    <div className={className ?? 'flex flex-col gap-2'}>
      <div className="flex flex-wrap justify-end gap-2">
        {primaryAction}
        {topRightAction}
        {useSingleRow ? secondaryActions : null}
      </div>
      {!!secondaryActions && !useSingleRow && (
        <div className="flex flex-wrap justify-end gap-2">{secondaryActions}</div>
      )}
    </div>
  );
}
