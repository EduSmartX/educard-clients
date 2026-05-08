/**
 * Leave Allocation Stats Cards Component
 * Displays statistics for active policies and leave types
 */

import { CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeaveAllocation } from '@/lib/api/leave-api';

interface LeaveAllocationStatsProps {
  allocations: LeaveAllocation[];
}

export function LeaveAllocationStats({ allocations }: LeaveAllocationStatsProps) {
  const activeCount = allocations.filter(
    (a) => !a.effective_to || new Date(a.effective_to) > new Date()
  ).length;

  const leaveTypesCount = new Set(allocations.map((a) => a.leave_type_name)).size;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="relative overflow-hidden border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="w-full h-full bg-green-100 rounded-full opacity-20"></div>
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Policies</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">{activeCount}</div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Currently effective and active
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="w-full h-full bg-blue-100 rounded-full opacity-20"></div>
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Leave Types</CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-600">{leaveTypesCount}</div>
          <p className="text-xs text-muted-foreground mt-2">Different categories configured</p>
        </CardContent>
      </Card>
    </div>
  );
}
