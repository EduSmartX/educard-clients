/**
 * Holiday Calendar Page
 * Organization-wide holiday calendar management
 */

import { HolidayCalendar } from '@/features/holidays';

export default function HolidayCalendarPage() {
  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <HolidayCalendar />
    </div>
  );
}
