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
    <div className={cn('bg-white rounded-xl p-6 shadow-sm border border-gray-100', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onViewCalendar && (
          <button
            onClick={onViewCalendar}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View Calendar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={cn(
              'p-4 rounded-lg border-2 transition-all hover:shadow-md',
              event.color && colorClasses[event.color as keyof typeof colorClasses]
                ? colorClasses[event.color as keyof typeof colorClasses]
                : 'bg-gray-50 text-gray-600 border-gray-200'
            )}
          >
            {/* Date Badge */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase">{event.month}</span>
                <span className="text-2xl font-bold leading-none">{event.day}</span>
              </div>
              <Calendar className="h-5 w-5 mt-1" />
            </div>

            {/* Event Info */}
            <div>
              <h4 className="font-semibold text-sm mb-1 line-clamp-2">{event.title}</h4>
              <p className="text-xs opacity-75">{event.time}</p>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">No upcoming events scheduled</div>
      )}
    </div>
  );
}
