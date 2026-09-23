export const SLOT_STATUS = {
  PAST: "past",
  CURRENT: "current",
  UPCOMING: "upcoming",
} as const;

export type SlotStatus = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS];

/**
 * Determines the current status of a timetable slot based on start/end times.
 * Compares against the current time to return past, current, or upcoming.
 */
export function getSlotStatus(startTime: string, endTime: string): SlotStatus {
  const now = new Date();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (nowMins >= startMins && nowMins < endMins) {
    return SLOT_STATUS.CURRENT;
  }
  if (nowMins < startMins) {
    return SLOT_STATUS.UPCOMING;
  }
  return SLOT_STATUS.PAST;
}

/**
 * Get current day index (0=Mon, 1=Tue, ..., 6=Sun) from JS Date.
 */
export function getCurrentDayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Format a "HH:MM" or "HH:MM:SS" time string into 12-hour format (e.g. "9:30 AM").
 */
export function formatSlotTime(time: string): string {
  if (!time) {
    return "";
  }
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** School weekdays (Mon–Sat, no Sunday) */
export const SCHOOL_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Gradient colors per timetable slot type */
export const SLOT_TYPE_COLORS: Record<string, string> = {
  class: "from-emerald-400 to-green-500",
  break: "from-amber-300 to-orange-400",
  lunch: "from-pink-400 to-rose-500",
  assembly: "from-blue-400 to-indigo-500",
  lab: "from-violet-400 to-purple-500",
};
