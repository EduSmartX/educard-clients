import type { DayIconType } from '../utils/calendar-day-state';

const ICON_CONFIG: Record<string, { bg: string; label: string }> = {
  present: { bg: 'bg-green-500', label: '✓' },
  absent: { bg: 'bg-red-500', label: '✕' },
  holiday: { bg: 'bg-purple-500', label: 'H' },
  leave: { bg: 'bg-orange-500', label: '✕' },
};

export function DayIcon({
  iconType,
  attendance,
}: Readonly<{
  iconType: DayIconType;
  attendance?: { morning_present: boolean; afternoon_present: boolean };
}>) {
  if (!iconType) {
    return null;
  }

  if (iconType === 'half-day') {
    const morningPresent = attendance?.morning_present ?? false;
    const afternoonPresent = attendance?.afternoon_present ?? false;
    return (
      <div className="mx-auto h-5 w-5">
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <path
            d="M 2 12 A 10 10 0 0 0 22 12 Z"
            fill={afternoonPresent ? '#22c55e' : '#ef4444'}
            stroke="white"
            strokeWidth="0.5"
          />
          <path
            d="M 2 12 A 10 10 0 0 1 22 12 Z"
            fill={morningPresent ? '#22c55e' : '#ef4444'}
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    );
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
