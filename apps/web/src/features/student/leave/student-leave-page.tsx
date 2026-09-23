import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarOff, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { PageHeader } from '@/components/common';
import { useLeaveBalance, useLeaveRequests, useApplyLeave } from './hooks';
import { parseApiError } from '@/lib/utils/error-handler';

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
  const applyLeave = useApplyLeave();

  const [showForm, setShowForm] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');

  const resetForm = () => {
    setShowForm(false);
    setSelectedBalance('');
    setStartDate(null);
    setEndDate(null);
    setReason('');
  };

  const computeDays = () => {
    if (!startDate || !endDate) {
      return 0;
    }
    if (endDate < startDate) {
      return 0;
    }
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatForApi = (d: Date) => d.toISOString().split('T')[0];

  const handleApply = () => {
    const days = computeDays();
    if (!selectedBalance || !startDate || !endDate || days <= 0 || !reason.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    applyLeave.mutate(
      {
        leave_balance: selectedBalance,
        start_date: formatForApi(startDate),
        end_date: formatForApi(endDate),
        number_of_days: days,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Leave request submitted for approval');
          resetForm();
        },
        onError: (err) => {
          toast.error(parseApiError(err) || 'Failed to submit leave request');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Leave balance and requests 🌿"
        icon={CalendarOff}
        actions={
          balance && balance.length > 0 && !showForm
            ? [{ label: 'Apply Leave', onClick: () => setShowForm(true), icon: Plus }]
            : []
        }
      />

      {/* Balance Cards */}
      {(() => {
        if (balanceLoading) {
          return (
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          );
        }
        if (!balance || balance.length === 0) {
          return (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-3xl">🌱</span>
                <p className="text-sm text-gray-500">No leave allocation found</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {balance.map((b) => (
              <Card key={b.public_id} className="overflow-hidden">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-gray-500">{b.leave_name}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-800">{Number(b.available)}</span>
                    <span className="text-xs text-gray-400">
                      / {Number(b.total_allocated)} days
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                      style={{
                        width: `${Number(b.total_allocated) > 0 ? (Number(b.available) / Number(b.total_allocated)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {Number(b.pending) > 0 && (
                    <p className="mt-1 text-[10px] text-amber-500">{Number(b.pending)} pending</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        );
      })()}

      {/* Apply Leave Form */}
      {showForm && balance && balance.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="leave-type-select"
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Leave Type
                </label>
                <select
                  id="leave-type-select"
                  value={selectedBalance}
                  onChange={(e) => setSelectedBalance(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select leave type</option>
                  {balance.map((b) => (
                    <option key={b.public_id} value={b.public_id}>
                      {b.leave_name} ({Number(b.available)} available)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-600">Start Date</span>
                  <DatePicker
                    value={startDate}
                    onChange={(d) => {
                      setStartDate(d);
                      if (d && endDate && endDate < d) {
                        setEndDate(null);
                      }
                    }}
                    placeholder="Select start date"
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-gray-600">End Date</span>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Select end date"
                    minDate={startDate || new Date()}
                  />
                </div>
              </div>
              {computeDays() > 0 && (
                <p className="text-xs text-gray-500">
                  Duration:{' '}
                  <strong>
                    {computeDays()} day{computeDays() !== 1 ? 's' : ''}
                  </strong>
                </p>
              )}
              <div>
                <label
                  htmlFor="leave-reason"
                  className="mb-1 block text-xs font-medium text-gray-600"
                >
                  Reason
                </label>
                <textarea
                  id="leave-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you applying for leave?"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApply} disabled={applyLeave.isPending} className="gap-1">
                  <Send className="h-4 w-4" />
                  {applyLeave.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
            {(() => {
              if (requestsLoading) {
                return <Skeleton className="h-32 w-full rounded-xl" />;
              }
              if (!requests || requests.length === 0) {
                return (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <span className="text-4xl">🌈</span>
                    <p className="text-sm text-gray-500">No leave requests yet</p>
                  </div>
                );
              }
              return (
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
                            <p className="text-sm font-medium text-gray-800">{req.leave_name}</p>
                            <Badge className={style.color}>{req.status}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {formatDate(req.start_date)} — {formatDate(req.end_date)} (
                            {req.number_of_days} day{req.number_of_days !== 1 ? 's' : ''})
                          </p>
                          {req.reason && (
                            <p className="mt-1 text-xs text-gray-400 italic">{req.reason}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
