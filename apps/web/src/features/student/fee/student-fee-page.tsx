import { motion } from 'framer-motion';
import { IndianRupee, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common';
import { useFeeSummary, useFeePayments } from './hooks';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function StudentFeePage() {
  const { data: summary, isLoading: summaryLoading } = useFeeSummary();
  const { data: payments, isLoading: paymentsLoading } = useFeePayments();

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
                {formatCurrency(summary.total_fee)}
              </p>
              <span className="text-lg">🏫</span>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.total_paid)}
              </p>
              <span className="text-lg">✅</span>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-400">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatCurrency(summary.total_pending)}
              </p>
              <span className="text-lg">{summary.total_pending > 0 ? '⏳' : '🎉'}</span>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

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
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {p.payment_method && ` • ${p.payment_method}`}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">{p.status}</Badge>
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
