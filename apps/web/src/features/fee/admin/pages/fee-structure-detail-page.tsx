/**
 * Fee Structure Detail Page
 * Read-only view of a single fee structure and its components.
 */

import { format } from 'date-fns';
import { ArrowLeft, IndianRupee, Loader2, Pencil } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/app-config';
import { useFeeStructure } from '../../hooks/use-fee-queries';

function formatAmount(amount: number) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'dd MMM yyyy');
}

export function FeeStructureDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: structure, isLoading } = useFeeStructure(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold">Fee Structure Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The fee structure you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to={ROUTES.FEES.STRUCTURES}>Back to Structures</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={structure.name} description={structure.academic_year} icon={IndianRupee}>
        <Button variant="outline" onClick={() => navigate(ROUTES.FEES.STRUCTURES)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Structures
        </Button>
        <Button onClick={() => navigate(`${ROUTES.FEES.STRUCTURES}/${structure.public_id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="border-b bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-lg">Overview</CardTitle>
            <Badge variant={structure.is_active ? 'default' : 'secondary'}>
              {structure.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <section className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Total Amount</p>
              <p className="font-semibold text-slate-900">{formatAmount(structure.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Due Date</p>
              <p className="font-medium text-slate-800">{formatDate(structure.due_date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Students Assigned</p>
              <p className="font-medium text-slate-800">{structure.student_count}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Components</p>
              <p className="font-medium text-slate-800">
                {structure.component_count} ({structure.mandatory_count} mandatory,{' '}
                {structure.optional_count} optional)
              </p>
            </div>
          </section>

          {structure.description && (
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800">Description</h3>
              <p className="text-sm whitespace-pre-wrap text-slate-600">{structure.description}</p>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Classes</h3>
            {structure.class_names.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {structure.class_names.map((className) => (
                  <Badge key={className} variant="secondary">
                    {className}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No classes assigned.</p>
            )}
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-slate-50/70">
          <CardTitle className="text-lg">Fee Components</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {structure.components.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structure.components.map((component) => (
                  <TableRow key={component.public_id}>
                    <TableCell className="font-medium">{component.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{component.component_type}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{component.description || '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(component.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatAmount(structure.total_amount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No components configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
