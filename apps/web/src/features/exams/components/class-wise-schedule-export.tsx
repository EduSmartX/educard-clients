/**
 * Class-wise Exam Schedule Export
 *
 * Prints one page per class for a given exam session, so each sheet can be
 * printed and attached to that class's noticeboard.
 */

import { format } from 'date-fns';
import { toast } from 'sonner';
import { EXAM_SESSION_TYPE_LABELS, type Exam, type ExamSession } from '@educard/shared';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { fetchExams } from '../api/exams-api';

/** Escape untrusted values before they are interpolated into the print HTML. */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value: string | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!value) {
    return '—';
  }
  return format(new Date(value), pattern);
}

function formatTimeRange(start: string | null, end: string | null): string {
  const toLabel = (time: string) => format(new Date(`2000-01-01T${time}`), 'hh:mm a');
  if (start && end) {
    return `${toLabel(start)} – ${toLabel(end)}`;
  }
  if (start) {
    return toLabel(start);
  }
  return '—';
}

/** Group exams by class, each sorted chronologically. */
function groupByClass(exams: Exam[]): Map<string, Exam[]> {
  const grouped = new Map<string, Exam[]>();
  for (const exam of exams) {
    const existing = grouped.get(exam.class_name);
    if (existing) {
      existing.push(exam);
    } else {
      grouped.set(exam.class_name, [exam]);
    }
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => {
      const dateDiff = (a.date ?? '').localeCompare(b.date ?? '');
      return dateDiff !== 0 ? dateDiff : (a.start_time ?? '').localeCompare(b.start_time ?? '');
    });
  }

  return new Map([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function buildClassSection(
  session: ExamSession,
  className: string,
  exams: Exam[],
  organizationName: string
): string {
  const rows = exams
    .map(
      (exam) => `
        <tr>
          <td>
            <div class="date">${escapeHtml(formatDate(exam.date))}</div>
            <div class="weekday">${exam.date ? escapeHtml(formatDate(exam.date, 'EEEE')) : ''}</div>
          </td>
          <td>${escapeHtml(formatTimeRange(exam.start_time, exam.end_time))}</td>
          <td class="subject">${escapeHtml(exam.subject_name)}</td>
          <td class="num">${escapeHtml(exam.max_marks)}</td>
          <td class="num">${escapeHtml(exam.passing_marks)}</td>
        </tr>
      `
    )
    .join('');

  const sessionType = EXAM_SESSION_TYPE_LABELS[session.session_type] ?? session.session_type;

  return `
    <section class="sheet">
      <header>
        <h1>${escapeHtml(organizationName)}</h1>
        <h2>${escapeHtml(session.name)} <span class="type">(${escapeHtml(sessionType)})</span></h2>
        <p class="range">
          ${escapeHtml(formatDate(session.start_date))} &ndash; ${escapeHtml(formatDate(session.end_date))}
        </p>
        <p class="class-name">Class: <strong>${escapeHtml(className)}</strong></p>
      </header>

      <table>
        <thead>
          <tr>
            <th style="width: 22%">Date</th>
            <th style="width: 24%">Time</th>
            <th>Subject</th>
            <th style="width: 12%">Max</th>
            <th style="width: 12%">Pass</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <footer>
        <span>Total exams: ${exams.length}</span>
        <span>Generated on ${escapeHtml(format(new Date(), 'dd MMM yyyy, hh:mm a'))}</span>
      </footer>
    </section>
  `;
}

function buildPrintableHtml(
  session: ExamSession,
  grouped: Map<string, Exam[]>,
  organizationName: string
): string {
  const sections = [...grouped.entries()]
    .map(([className, exams]) => buildClassSection(session, className, exams, organizationName))
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(session.name)} - Class-wise Exam Schedule</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      color: #1f2937;
      font-size: 12px;
    }
    .sheet { page-break-after: always; }
    .sheet:last-child { page-break-after: auto; }
    header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 16px; }
    h1 { font-size: 18px; font-weight: 700; }
    h2 { font-size: 15px; font-weight: 600; margin-top: 4px; color: #4f46e5; }
    .type { font-weight: 400; color: #6b7280; }
    .range { margin-top: 4px; color: #6b7280; }
    .class-name { margin-top: 8px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d1d5db; padding: 7px 9px; text-align: left; vertical-align: top; }
    th { background: #eef2ff; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .date { font-weight: 600; }
    .weekday { font-size: 10px; color: #6b7280; }
    .subject { font-weight: 600; }
    .num { text-align: center; }
    footer {
      display: flex; justify-content: space-between;
      margin-top: 12px; font-size: 10px; color: #6b7280;
    }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>${sections}</body>
</html>`;
}

/** Fetch a session's exams and open a print view with one page per class. */
export async function printClassWiseSchedule(
  session: ExamSession,
  organizationName = ''
): Promise<void> {
  try {
    const response = await fetchExams({
      session: session.public_id,
      page: 1,
      page_size: 500,
    });
    const exams = response.data ?? [];

    if (exams.length === 0) {
      toast.error('This session has no exams to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow pop-ups for this site to print the schedule.');
      return;
    }

    const html = buildPrintableHtml(session, groupByClass(exams), organizationName);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Let the document lay out before the print dialog measures it.
    setTimeout(() => printWindow.print(), 400);
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to build the exam schedule.'));
  }
}
