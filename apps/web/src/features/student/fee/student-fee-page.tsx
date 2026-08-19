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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const PIE_COLORS = ['#10b981', '#f59e0b'];

type FeeComponentItem = NonNullable<ReturnType<typeof useFeeComponents>['data']>[number];
type FeePaymentItem = NonNullable<ReturnType<typeof useFeePayments>['data']>[number];
type OptInMutation = ReturnType<typeof useOptIn>;
type OptOutMutation = ReturnType<typeof useOptOut>;

function OptionalFeeComponentRow({
  component: c,
  activeComponentId,
  setActiveComponentId,
  requestNote,
  setRequestNote,
  optIn,
  optOut,
}: Readonly<{
  component: FeeComponentItem;
  activeComponentId: string | null;
  setActiveComponentId: (id: string | null) => void;
  requestNote: string;
  setRequestNote: (note: string) => void;
  optIn: OptInMutation;
  optOut: OptOutMutation;
}>) {
  const isActive = activeComponentId === c.public_id;
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-gray-800">{c.name}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                c.is_selected ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${c.is_selected ? 'bg-emerald-500' : 'bg-gray-300'}`}
              />
              {c.is_selected ? 'Included in fee' : 'Not included'}
            </span>
            {c.approval_status === 'pending' && (
              <Badge className="bg-amber-50 text-[10px] text-amber-600">⏳ Pending Approval</Badge>
            )}
            {c.approval_status === 'approved' && (
              <Badge className="bg-emerald-50 text-[10px] text-emerald-600">✅ Approved</Badge>
            )}
            {c.approval_status === 'rejected' && (
              <Badge className="bg-red-50 text-[10px] text-red-600">❌ Rejected</Badge>
            )}
          </div>
          {c.admin_note && (
            <p className="text-xs text-gray-400 italic">Admin note: {c.admin_note}</p>
          )}
          {isActive && (
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
                          c.is_selected ? 'Opt-out request submitted' : 'Opt-in request submitted'
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
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-semibold text-gray-700">{formatCurrency(Number(c.amount))}</p>
          {c.can_request_change && !isActive && (
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
          {!c.can_request_change && c.approval_status === 'pending' && (
            <span className="text-[10px] text-amber-500">Awaiting admin</span>
          )}
        </div>
      </div>
    </div>
  );
}

function FeeComponentsSection({
  isLoading,
  mandatoryComponents,
  optionalComponents,
  activeComponentId,
  setActiveComponentId,
  requestNote,
  setRequestNote,
  optIn,
  optOut,
}: Readonly<{
  isLoading: boolean;
  mandatoryComponents: FeeComponentItem[];
  optionalComponents: FeeComponentItem[];
  activeComponentId: string | null;
  setActiveComponentId: (id: string | null) => void;
  requestNote: string;
  setRequestNote: (note: string) => void;
  optIn: OptInMutation;
  optOut: OptOutMutation;
}>) {
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (mandatoryComponents.length === 0 && optionalComponents.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No fee components</p>;
  }
  return (
    <div className="space-y-5">
      {mandatoryComponents.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase">
              Mandatory
            </span>
            <span className="text-[10px] text-gray-400">({mandatoryComponents.length})</span>
          </div>
          <div className="divide-y rounded-lg border">
            {mandatoryComponents.map((c) => (
              <div key={c.public_id} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-medium text-gray-800">{c.name}</p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(Number(c.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {optionalComponents.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-purple-600 uppercase">
              Optional
            </span>
            <span className="text-[10px] text-gray-400">({optionalComponents.length})</span>
          </div>
          <div className="divide-y rounded-lg border">
            {optionalComponents.map((c) => (
              <OptionalFeeComponentRow
                key={c.public_id}
                component={c}
                activeComponentId={activeComponentId}
                setActiveComponentId={setActiveComponentId}
                requestNote={requestNote}
                setRequestNote={setRequestNote}
                optIn={optIn}
                optOut={optOut}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentHistoryList({
  isLoading,
  payments,
}: Readonly<{ isLoading: boolean; payments: FeePaymentItem[] | undefined }>) {
  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }
  if (!payments || payments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-gray-500">No payments recorded yet</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {payments.map((p) => (
        <div key={p.public_id} className="flex items-center gap-3 rounded-lg border p-3">
          <div className="rounded-full bg-emerald-100 p-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">{formatCurrency(Number(p.amount))}</p>
            <p className="text-xs text-gray-500">
              {new Date(p.payment_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {p.payment_mode && ` • ${p.payment_mode}`}
            </p>
          </div>
          {p.receipt_number && <span className="text-xs text-gray-400">#{p.receipt_number}</span>}
          <Badge className="bg-emerald-100 text-emerald-700 capitalize">{p.transaction_type}</Badge>
        </div>
      ))}
    </div>
  );
}

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

  const mandatoryComponents = (components ?? []).filter((c) => c.component_type === 'mandatory');
  const optionalComponents = (components ?? []).filter((c) => c.component_type === 'optional');

  return (
    <div className="space-y-6">
      <PageHeader title="Fee" description="Fee details and payment history 💰" icon={IndianRupee} />

      {/* Summary Cards */}
      {(() => {
        if (summaryLoading) {
          return (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          );
        }
        if (!summary) {
          return null;
        }
        // Optional on older backends, so treat missing values as no discount.
        const discountAmount = Number(summary.discount_amount) || 0;
        const discountPercentage = Number(summary.discount_percentage) || 0;
        const baseAmount = Number(summary.base_amount) || 0;
        const hasDiscount = discountAmount > 0;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`grid gap-4 ${hasDiscount ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}
          >
            <Card className="border-l-4 border-l-blue-400">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Total Fee</p>
                <p className="mt-1 text-2xl font-bold text-gray-800">
                  {formatCurrency(Number(summary.total_amount))}
                </p>
                {hasDiscount && (
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(baseAmount)}</p>
                )}
                <span className="text-lg">🏫</span>
              </CardContent>
            </Card>
            {hasDiscount && (
              <Card className="border-l-4 border-l-violet-400">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Discount</p>
                  <p className="mt-1 text-2xl font-bold text-violet-600">
                    -{formatCurrency(discountAmount)}
                  </p>
                  {discountPercentage > 0 && (
                    <Badge className="bg-violet-100 text-violet-700">
                      {discountPercentage}% off
                    </Badge>
                  )}
                  <span className="ml-1 text-lg">🎁</span>
                </CardContent>
              </Card>
            )}
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
        );
      })()}

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
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index]} />
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
            <FeeComponentsSection
              isLoading={componentsLoading}
              mandatoryComponents={mandatoryComponents}
              optionalComponents={optionalComponents}
              activeComponentId={activeComponentId}
              setActiveComponentId={setActiveComponentId}
              requestNote={requestNote}
              setRequestNote={setRequestNote}
              optIn={optIn}
              optOut={optOut}
            />
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
            <PaymentHistoryList isLoading={paymentsLoading} payments={payments} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
