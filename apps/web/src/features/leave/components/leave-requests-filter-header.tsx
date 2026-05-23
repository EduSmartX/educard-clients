/**
 * Leave Requests Filter Header
 * Filter controls for the leave requests table
 */
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LeaveRequestsFilterHeaderProps {
  activeFiltersCount: number;
  onToggleFilters: () => void;
  onReset: () => void;
}

export function LeaveRequestsFilterHeader({
  activeFiltersCount,
  onToggleFilters,
  onReset,
}: Readonly<LeaveRequestsFilterHeaderProps>) {
  return (
    <div className="flex items-center gap-2">
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2 text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          Clear ({activeFiltersCount})
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFilters}
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
