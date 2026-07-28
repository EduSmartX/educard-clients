/** Fee structure form helpers + shared types */

export interface ComponentRow {
  key: string;
  name: string;
  amount: string;
  component_type: string;
  order: number;
}

export interface FormErrors {
  name?: string;
  academic_year?: string;
  due_date?: string;
  class_public_ids?: string;
  components?: string;
  [key: string]: string | undefined;
}

/** Build impact message lines from class change impact response */
export function buildImpactLines(impact: {
  students_will_be_assigned: number;
  unpaid_fees_will_be_deleted: number;
  paid_fees_will_be_cancelled: number;
  total_paid_amount_affected: number | string;
}): string[] {
  const lines: string[] = [];
  if (impact.students_will_be_assigned > 0) {
    lines.push(
      `• ${impact.students_will_be_assigned} student fee record(s) will be auto-assigned in newly linked classes.`,
    );
  }
  if (impact.unpaid_fees_will_be_deleted > 0) {
    lines.push(
      `• ${impact.unpaid_fees_will_be_deleted} unpaid student fee record(s) will be deleted.`,
    );
  }
  if (impact.paid_fees_will_be_cancelled > 0) {
    lines.push(
      `• ${impact.paid_fees_will_be_cancelled} paid/partial records will be marked as Cancelled.`,
    );
  }
  if (Number(impact.total_paid_amount_affected) > 0) {
    lines.push(
      `• ₹${Number(impact.total_paid_amount_affected).toLocaleString('en-IN')} already collected may need refund handling.`,
    );
  }
  return lines;
}

/** Normalize fee components for comparison */
export function normalizeComponents(
  list: { name: string; amount: number | string; component_type?: string }[],
): string {
  return [...list]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      component =>
        `${component.name}|${Number(component.amount).toFixed(2)}|${component.component_type ?? ''}`,
    )
    .join(',');
}
