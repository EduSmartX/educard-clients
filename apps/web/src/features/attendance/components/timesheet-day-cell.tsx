import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type DayState = 'present' | 'absent' | 'leave-approved' | 'leave-pending' | 'holiday' | 'none';

interface AttendanceRecord {
  morning_present: boolean;
  afternoon_present: boolean;
  is_leave?: boolean;
}

interface HolidayInfo {
  type: string;
  name: string;
  description?: string;
}

interface LeaveInfo {
  leave_name: string;
}

interface TimesheetDayCellProps {
  date: Date;
  dateKey: string;
  state: DayState;
  record: AttendanceRecord | undefined;
  leaveInfo: LeaveInfo | undefined;
  holidayInfo: HolidayInfo | undefined;
  isClickable: boolean;
  stateClassName: string;
  onDateClick: (date: Date, state: DayState) => void;
  getHolidayLabels: (info: HolidayInfo | undefined) => { shortLabel: string; fullDescription: string };
  getMobileStateBgColor: (state: DayState) => string;
}

/** Renders the icon for a day based on its attendance state (desktop view) */
function DayIcon({
  state,
  record,
  leaveInfo,
  holidayInfo,
  getHolidayLabels,
}: Pick<TimesheetDayCellProps, 'state' | 'record' | 'leaveInfo' | 'holidayInfo' | 'getHolidayLabels'>) {
  if (state === 'leave-approved' || state === 'leave-pending') {
    return <LeaveIcon state={state} leaveInfo={leaveInfo} />;
  }

  if (record && !record.is_leave && record.morning_present !== undefined && record.afternoon_present !== undefined) {
    return <AttendanceIcon morningPresent={record.morning_present} afternoonPresent={record.afternoon_present} />;
  }

  if (state === 'present') {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
        <Check className="h-3 w-3 stroke-[2.5] text-white" />
      </div>
    );
  }
  if (state === 'absent') {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
        <X className="h-3 w-3 stroke-[2.5] text-white" />
      </div>
    );
  }
  if (state === 'holiday') {
    const { shortLabel, fullDescription } = getHolidayLabels(holidayInfo);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex w-full cursor-help flex-col items-center gap-0.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
              H
            </div>
            <span className="w-full px-0.5 text-center text-[7px] leading-tight font-semibold break-words text-purple-700">
              {shortLabel}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="rounded-md bg-gray-900 px-3 py-2 text-white shadow-lg">
          <p className="text-sm font-semibold">{fullDescription}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return null;
}

function LeaveIcon({ state, leaveInfo }: { state: DayState; leaveInfo: LeaveInfo | undefined }) {
  const leaveName = leaveInfo?.leave_name || 'Leave';
  const leaveStatus = state === 'leave-approved' ? 'Approved' : 'Pending';
  const truncatedName = leaveName.length > 12 ? `${leaveName.substring(0, 10)}..` : leaveName;
  const bgClass = state === 'leave-approved' ? 'bg-orange-500' : 'bg-yellow-500';
  const textClass = state === 'leave-approved' ? 'text-orange-900' : 'text-yellow-900';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-full cursor-help flex-col items-center gap-0.5">
          <div className={`h-6 w-6 rounded-full ${bgClass} flex items-center justify-center shadow-sm`}>
            <X className="h-4 w-4 stroke-[3] text-white" />
          </div>
          <span className={`text-[10px] ${textClass} w-full px-0.5 text-center leading-tight font-extrabold break-words`}>
            {truncatedName}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="rounded-md bg-gray-900 px-3 py-2 text-white shadow-lg">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">{leaveName}</p>
          <p className="text-xs text-gray-300">Status: {leaveStatus}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function AttendanceIcon({ morningPresent, afternoonPresent }: { morningPresent: boolean; afternoonPresent: boolean }) {
  if (morningPresent && afternoonPresent) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
        <Check className="h-3 w-3 stroke-[2.5] text-white" />
      </div>
    );
  }
  if (!morningPresent && !afternoonPresent) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
        <X className="h-3 w-3 stroke-[2.5] text-white" />
      </div>
    );
  }
  // Half day - split circle
  return (
    <div className="relative h-6 w-6">
      <svg viewBox="0 0 24 24" className="h-full w-full">
        <path d="M 2 12 A 10 10 0 0 0 22 12 Z" fill={afternoonPresent ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth="0.5" />
        <path d="M 2 12 A 10 10 0 0 1 22 12 Z" fill={morningPresent ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/** Renders the mobile view of a day cell */
function MobileDayContent({
  date,
  state,
  record,
  getMobileStateBgColor,
}: Omit<Pick<TimesheetDayCellProps, 'date' | 'dateKey' | 'state' | 'record' | 'getMobileStateBgColor'>, 'dateKey'>) {
  const bgColor = getMobileStateBgColor(state);

  if (state === 'holiday') {
    return (
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${bgColor}`}>
        H
      </div>
    );
  }

  // Half-day split circle with number overlay
  if (
    record &&
    !record.is_leave &&
    record.morning_present !== undefined &&
    record.afternoon_present !== undefined &&
    record.morning_present !== record.afternoon_present
  ) {
    return (
      <div className="relative flex h-7 w-7 items-center justify-center">
        <svg viewBox="0 0 28 28" className="absolute inset-0 h-full w-full">
          <path d="M 0 14 A 14 14 0 0 1 28 14 Z" fill={record.morning_present ? '#22c55e' : '#ef4444'} />
          <path d="M 0 14 A 14 14 0 0 0 28 14 Z" fill={record.afternoon_present ? '#22c55e' : '#ef4444'} />
        </svg>
        <span className="relative text-[10px] font-bold text-white">{format(date, 'd')}</span>
      </div>
    );
  }

  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${bgColor}`}>
      {format(date, 'd')}
    </div>
  );
}

export function TimesheetDayCell({
  date,
  dateKey,
  state,
  record,
  leaveInfo,
  holidayInfo,
  isClickable,
  stateClassName,
  onDateClick,
  getHolidayLabels,
  getMobileStateBgColor,
}: TimesheetDayCellProps) {
  const dayContent = (
    <button
      type="button"
      onClick={() => isClickable && onDateClick(date, state)}
      disabled={!isClickable}
      className={`flex aspect-square flex-col items-center justify-between rounded border p-1 transition ${stateClassName} ${
        isClickable
          ? 'cursor-pointer hover:border-blue-400 hover:ring-2 hover:ring-blue-400'
          : 'cursor-default'
      }`}
    >
      {/* Desktop view */}
      <div className="hidden w-full text-center sm:block">
        <div className="text-[7px] font-medium text-gray-500">{format(date, 'MMM')}</div>
        <div className="text-xs font-bold">{format(date, 'd')}</div>
      </div>
      <div className="hidden w-full flex-1 flex-col items-center justify-center sm:flex">
        <DayIcon
          state={state}
          record={record}
          leaveInfo={leaveInfo}
          holidayInfo={holidayInfo}
          getHolidayLabels={getHolidayLabels}
        />
      </div>

      {/* Mobile view */}
      <div className="flex h-full w-full items-center justify-center sm:hidden">
        <MobileDayContent
          date={date}
          state={state}
          record={record}
          getMobileStateBgColor={getMobileStateBgColor}
        />
      </div>
    </button>
  );

  if (state === 'holiday' && holidayInfo) {
    return (
      <TooltipProvider key={dateKey}>
        <Tooltip>
          <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-semibold">{holidayInfo.name}</p>
              <p className="text-xs text-gray-600">{holidayInfo.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return dayContent;
}
