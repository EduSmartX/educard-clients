import { useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, CheckCircle2, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common';
import { useFeeSummary, useFeePayments, useFeeComponents, useOptIn, useOptOut } from './hooks';
import type { FeeComponent } from './api';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const PIE_COLORS = ['#10b981', '#f59e0b'];

export default function StudentFeePage() {
  const { data: summary, isLoading: summaryLoading } = useFeeSummary();
  const { data: payments, isLoading: paymentsLoading } = useFeePayments();
  const { data: components, isLoading: componentsLoading } = useFeeComponents();
  const optIn = useOptIn();
  const optOut = useOptOut();
  const [requestNote, setRequestNote] = useState('');
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);

  const pieData = summary
    ? [
        { name: 'Paid', value: Number(summary.amount_paid) || 0 },
        { name: 'Pending', value: Number(summary.balance_due) || 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Fee" description="Fee details and payment history 💰" icon={IndianRupee} />

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          <Card className="border-l-4 border-l-blue-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total Fee</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {formatCurrency(Number(summary.total_amount))}
              </p>
              <span className="text-lg">🏫</span>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatCurrency(Number(summary.amount_paid))}
              </p>
              <span className="text-lg">✅</span>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatCurrency(Number(summary.balance_due))}
              </p>
              <span className="text-lg">{Number(summary.balance_due) > 0 ? '⏳' : '🎉'}</span>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Pie Chart + Due Date */}
      {summary && Number(summary.total_amount) > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-around">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={2}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-600">
                    Paid: {formatCurrency(Number(summary.amount_paid))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-gray-600">
                    Pending: {formatCurrency(Number(summary.balance_due))}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {Number(summary.paid_percentage)}% paid
                </div>
                {summary.due_date && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="h-3 w-3" />
                    Due:{' '}
                    {new Date(summary.due_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                )}
                {summary.is_overdue && (
                  <Badge className="mt-1 bg-red-100 text-red-700">Overdue</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* Fee Components */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Fee Components</CardTitle>
          </CardHeader>
          <CardContent>
            {componentsLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : components && components.length > 0 ? (
              <div className="divide-y">
                {components.map((c: FeeComponent) => (
                  <div key={c.public_id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Name + badges + status */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{c.name}</p>
                          <Badge
                            className={
                              c.component_type === 'mandatory'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-purple-50 text-purple-600'
                            }
                          >
                            {c.component_type === 'mandatory' ? 'Mandatory' : 'Optional'}
                          </Badge>
                        </div>

                        {/* Status row for optional components */}
                        {c.component_type === 'optional' && (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Selection status */}
                            <span
                              className={`inline-flex items-center gap-1 text-xs ${
                                c.is_selected ? 'text-emerald-600' : 'text-gray-400'
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  c.is_selected ? 'bg-emerald-500' : 'bg-gray-300'
                                }`}
                              />
                              {c.is_selected ? 'Included in fee' : 'Not included'}
                            </span>

                            {/* Approval status */}
                            {c.approval_status === 'pending' && (
                              <Badge className="bg-amber-50 text-[10px] text-amber-600">
                                ⏳ Pending Approval
                              </Badge>
                            )}
                            {c.approval_status === 'approved' && (
                              <Badge className="bg-emerald-50 text-[10px] text-emerald-600">
                                ✅ Approved
                              </Badge>
                            )}
                            {c.approval_status === 'rejected' && (
                              <Badge className="bg-red-50 text-[10px] text-red-600">
                                ❌ Rejected
                              </Badge>
                            )}
                          </div>
                        )}

                        {c.admin_note && (
                          <p className="text-xs text-gray-400 italic">Admin note: {c.admin_note}</p>
                        )}

                        {/* Opt-in/Opt-out input */}
                        {activeComponentId === c.public_id && (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder="Reason for request..."
                              value={requestNote}
                              onChange={(e) => setRequestNote(e.target.value)}
                              className="flex-1 rounded-md border px-2 py-1 text-sm"
                            />
                            <Button
                              size="sm"
                              disabled={!requestNote.trim() || optIn.isPending || optOut.isPending}
                              onClick={() => {
                                const action = c.is_selected ? optOut : optIn;
                                action.mutate(
                                  { publicId: c.public_id, requestNote: requestNote.trim() },
                                  {
                                    onSuccess: () => {
                                      toast.success(
                                        c.is_selected
                                          ? 'Opt-out request submitted'
                                          : 'Opt-in request submitted'
                                      );
                                      setActiveComponentId(null);
                                      setRequestNote('');
                                    },
                                    onError: () => toast.error('Request failed'),
                                  }
                                );
                              }}
                            >
                              Submit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setActiveComponentId(null);
                                setRequestNote('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Right: Amount + action */}
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-semibold text-gray-700">
                          {formatCurrency(Number(c.amount))}
                        </p>
                        {c.component_type === 'optional' &&
                          c.can_request_change &&
                          activeComponentId !== c.public_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => setActiveComponentId(c.public_id)}
                            >
                              {c.is_selected ? (
                                <>
                                  <ToggleLeft className="h-3 w-3" /> Opt Out
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-3 w-3" /> Opt In
                                </>
                              )}
                            </Button>
                          )}
                        {c.component_type === 'optional' &&
                          !c.can_request_change &&
                          c.approval_status === 'pending' && (
                            <span className="text-[10px] text-amber-500">Awaiting admin</span>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">No fee components</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💳 Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.public_id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(Number(p.amount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {p.payment_mode && ` • ${p.payment_mode}`}
                      </p>
                    </div>
                    {p.receipt_number && (
                      <span className="text-xs text-gray-400">#{p.receipt_number}</span>
                    )}
                    <Badge className="bg-emerald-100 text-emerald-700 capitalize">
                      {p.transaction_type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="text-4xl">🌼</span>
                <p className="text-sm text-gray-500">No payments recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
