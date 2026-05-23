import type { DayIconType } from '../utils/calendar-day-state';

const ICON_CONFIG: Record<string, { bg: string; label: string }> = {
  present: { bg: 'bg-green-500', label: '✓' },
  absent: { bg: 'bg-red-500', label: '✕' },
  holiday: { bg: 'bg-purple-500', label: 'H' },
  leave: { bg: 'bg-orange-500', label: '✕' },
};

export function DayIcon({ iconType }: Readonly<{ iconType: DayIconType }>) {
  if (!iconType) {
    return null;
  }

  const config = ICON_CONFIG[iconType];

  return (
    <div
      className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full ${config.bg} text-[10px] font-bold text-white`}
    >
      {config.label}
    </div>
  );
}
