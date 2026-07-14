import { motion } from 'framer-motion';
import { CalendarOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common';
import { useLeaveBalance, useLeaveRequests } from './hooks';

const STATUS_STYLES: Record<string, { color: string; emoji: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700', emoji: '⏳' },
  approved: { color: 'bg-emerald-100 text-emerald-700', emoji: '✅' },
  rejected: { color: 'bg-red-100 text-red-700', emoji: '❌' },
  cancelled: { color: 'bg-gray-100 text-gray-600', emoji: '🚫' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function StudentLeavePage() {
  const { data: balance, isLoading: balanceLoading } = useLeaveBalance();
  const { data: requests, isLoading: requestsLoading } = useLeaveRequests();

  return (
    <div className="space-y-6">
      <PageHeader title="Leave" description="Leave balance and requests 🌿" icon={CalendarOff} />

      {/* Balance Cards */}
      {balanceLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : balance && balance.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {balance.map((b) => (
            <Card key={b.leave_type} className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500">{b.leave_type_name}</p>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold text-gray-800">{b.remaining}</span>
                  <span className="text-xs text-gray-400">/ {b.allocated} days</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                    style={{ width: `${b.allocated > 0 ? (b.remaining / b.allocated) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-3xl">🌱</span>
            <p className="text-sm text-gray-500">No leave allocation found</p>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : requests && requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((req) => {
                  const style = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                  return (
                    <div
                      key={req.public_id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <span className="mt-0.5 text-xl">{style.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">{req.leave_type_name}</p>
                          <Badge className={style.color}>{req.status}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {formatDate(req.start_date)} — {formatDate(req.end_date)} (
                          {req.days_count} day{req.days_count !== 1 ? 's' : ''})
                        </p>
                        {req.reason && (
                          <p className="mt-1 text-xs text-gray-400 italic">{req.reason}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="text-4xl">🌈</span>
                <p className="text-sm text-gray-500">No leave requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
