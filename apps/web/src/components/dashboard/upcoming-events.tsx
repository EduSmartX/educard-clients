import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  month: string;
  day: string;
  color?: string;
}

interface UpcomingEventsProps {
  title?: string;
  events: UpcomingEvent[];
  onViewCalendar?: () => void;
  className?: string;
}

export function UpcomingEvents({
  title = 'Upcoming Events',
  events,
  onViewCalendar,
  className,
}: UpcomingEventsProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white p-6 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onViewCalendar && (
          <button
            type="button"
            onClick={onViewCalendar}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Calendar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={cn(
              'rounded-lg border-2 p-4 transition-all hover:shadow-md',
              event.color && colorClasses[event.color as keyof typeof colorClasses]
                ? colorClasses[event.color as keyof typeof colorClasses]
                : 'border-gray-200 bg-gray-50 text-gray-600'
            )}
          >
            {/* Date Badge */}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase">{event.month}</span>
                <span className="text-2xl leading-none font-bold">{event.day}</span>
              </div>
              <Calendar className="mt-1 h-5 w-5" />
            </div>

            {/* Event Info */}
            <div>
              <h4 className="mb-1 line-clamp-2 text-sm font-semibold">{event.title}</h4>
              <p className="text-xs opacity-75">{event.time}</p>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500">No upcoming events scheduled</div>
      )}
    </div>
  );
}
