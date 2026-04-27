// Leave type color mapping — shared across web and mobile

export interface LeaveTypeColorScheme {
  color: string;
  bg: string;
}

const LEAVE_TYPE_COLOR_MAP: Record<string, LeaveTypeColorScheme> = {
  casual: { color: '#3b82f6', bg: '#dbeafe' },
  sick: { color: '#ef4444', bg: '#fee2e2' },
  earn: { color: '#10b981', bg: '#d1fae5' },
  matern: { color: '#ec4899', bg: '#fce7f3' },
  patern: { color: '#8b5cf6', bg: '#ede9fe' },
  comp: { color: '#f59e0b', bg: '#fef3c7' },
};

const DEFAULT_LEAVE_COLOR: LeaveTypeColorScheme = { color: '#7c3aed', bg: '#ede9fe' };

function matchLeaveType(name: string): LeaveTypeColorScheme {
  const n = name.toLowerCase();
  for (const [key, scheme] of Object.entries(LEAVE_TYPE_COLOR_MAP)) {
    if (n.includes(key)) return scheme;
  }
  return DEFAULT_LEAVE_COLOR;
}

export function getLeaveTypeColor(name: string): string {
  return matchLeaveType(name).color;
}

export function getLeaveTypeBg(name: string): string {
  return matchLeaveType(name).bg;
}

export function getLeaveTypeColors(name: string): LeaveTypeColorScheme {
  return matchLeaveType(name);
}
