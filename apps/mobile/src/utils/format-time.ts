/**
 * Format a 24h time string (HH:MM or HH:MM:SS) to 12h format (e.g. "9:00 AM")
 */
export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
