import { LEAVE_STATUS } from '@educard/shared/constants';

/**
 * Calendar Day State Resolver
 * Determines the visual state (colors, icon, label) of a day in the attendance calendar
 */

interface DayContext {
  attendance: { morning_present: boolean; afternoon_present: boolean } | undefined;
  leave: { status: string } | undefined;
  exception: { override_type: string } | undefined;
  isHoliday: boolean;
  isFuture: boolean;
  isWeekendDay: boolean;
}

export type DayIconType = 'present' | 'absent' | 'holiday' | 'leave' | 'half-day' | null;

export interface DayState {
  bgColor: string;
  textColor: string;
  iconType: DayIconType;
  statusLabel: string;
}

export function resolveDayState(ctx: DayContext): DayState {
  // Check for force working day exception (overrides holiday/weekend)
  if (ctx.exception?.override_type === 'FORCE_WORKING') {
    if (ctx.attendance?.morning_present && ctx.attendance?.afternoon_present) {
      return {
        bgColor: 'bg-green-50 border-green-300',
        textColor: 'text-green-900',
        iconType: 'present',
        statusLabel: 'Testing',
      };
    }
    if (!ctx.isFuture) {
      return {
        bgColor: 'bg-red-50 border-red-300',
        textColor: 'text-red-900',
        iconType: 'absent',
        statusLabel: 'Testing',
      };
    }
    return {
      bgColor: 'bg-white border-gray-200',
      textColor: 'text-gray-900',
      iconType: null,
      statusLabel: 'Testing',
    };
  }

  // Check for force holiday exception or weekend
  if (ctx.exception?.override_type === 'FORCE_HOLIDAY' || ctx.isHoliday || ctx.isWeekendDay) {
    return {
      bgColor: 'bg-purple-50 border-purple-300',
      textColor: 'text-purple-900',
      iconType: 'holiday',
      statusLabel: 'Weekend',
    };
  }

  // Check for approved or pending leave
  if (ctx.leave?.status === LEAVE_STATUS.APPROVED || ctx.leave?.status === LEAVE_STATUS.PENDING) {
    return {
      bgColor: 'bg-orange-50 border-orange-300',
      textColor: 'text-orange-900',
      iconType: 'leave',
      statusLabel: '',
    };
  }

  // Check for present
  if (ctx.attendance?.morning_present && ctx.attendance?.afternoon_present) {
    return {
      bgColor: 'bg-green-50 border-green-300',
      textColor: 'text-green-900',
      iconType: 'present',
      statusLabel: '',
    };
  }

  // Check for half day (exactly one of the two sessions present)
  if (ctx.attendance && ctx.attendance.morning_present !== ctx.attendance.afternoon_present) {
    return {
      bgColor: 'bg-amber-50 border-amber-300',
      textColor: 'text-amber-900',
      iconType: 'half-day',
      statusLabel: '',
    };
  }

  // Check for absent (only on past dates)
  if (!ctx.isFuture) {
    return {
      bgColor: 'bg-red-50 border-red-300',
      textColor: 'text-red-900',
      iconType: 'absent',
      statusLabel: '',
    };
  }

  // Future dates
  return {
    bgColor: 'bg-gray-50 border-gray-200',
    textColor: 'text-gray-400',
    iconType: null,
    statusLabel: '',
  };
}
