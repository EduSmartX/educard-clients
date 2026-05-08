/**
 * Timetable PDF Export Component
 *
 * Reusable component for exporting timetables to PDF format.
 * Features:
 * - With colors (as displayed on screen)
 * - Without colors (black & white for printing)
 * - Tabular format
 * - Can be reused for exams, schedules, etc.
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Palette } from 'lucide-react';

export interface TimetableSlotData {
  slot_label: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  slot_type?: string;
}

export interface TimetableEntryData {
  subject_name?: string;
  teacher_name?: string;
  room?: string;
}

export interface TimetableDayData {
  slots: Array<{
    slot: TimetableSlotData;
    entry?: TimetableEntryData;
  }>;
}

export interface TimetableExportData {
  title: string;
  subtitle?: string;
  days: Record<number, TimetableDayData>;
  activeDays: number[];
  organization?: string;
  generatedAt?: string;
}

interface TimetablePdfExportProps {
  data: TimetableExportData;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const DAY_LABELS: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

const BREAK_LABELS: Record<string, string> = {
  lunch_break: 'Lunch Break',
  short_break: 'Short Break',
  assembly: 'Assembly',
};

function formatTime(time: string): string {
  if (!time) {
    return '';
  }
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function TimetablePdfExport({
  data,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  className = '',
}: TimetablePdfExportProps) {
  const handleQuickPrint = (mode: 'color' | 'bw') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }
    const htmlContent = generatePrintableHTML(data, mode);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize} className={className}>
            <Download className="mr-2 h-4 w-4" />
            Export / Print
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-60 rounded-xl border-2 border-indigo-100 bg-white p-2 shadow-xl"
        >
          <DropdownMenuItem
            onClick={() => handleQuickPrint('color')}
            className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-purple-50 focus:bg-purple-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <Palette className="h-4 w-4 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Print with Colors</p>
              <p className="text-xs text-gray-500">As displayed on screen</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleQuickPrint('bw')}
            className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-gray-50 focus:bg-gray-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">Print Black & White</p>
              <p className="text-xs text-gray-500">For standard printing</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function generatePrintableHTML(data: TimetableExportData, mode: 'color' | 'bw'): string {
  const isColor = mode === 'color';
  const firstDaySlots = data.days[data.activeDays[0]]?.slots || [];

  // Build subject color map
  const subjectColors: Record<string, { bg: string; text: string; border: string }> = {};
  let colorIndex = 0;
  const defaultColors = [
    { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
    { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' },
    { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1' },
    { bg: '#ccfbf1', text: '#115e59', border: '#14b8a6' },
    { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' },
  ];

  // Collect all unique subjects
  data.activeDays.forEach((dayNum) => {
    const dayData = data.days[dayNum];
    dayData?.slots.forEach(({ entry }) => {
      if (entry?.subject_name && !subjectColors[entry.subject_name]) {
        const colors = defaultColors[colorIndex % defaultColors.length];
        subjectColors[entry.subject_name] = colors;
        colorIndex++;
      }
    });
  });

  const tableRows = firstDaySlots
    .map(({ slot }, slotIdx) => {
      const isBreak = slot.is_break;
      const breakLabel = BREAK_LABELS[slot.slot_type || ''] || slot.slot_label;

      if (isBreak) {
        return `
          <tr class="break-row">
            <td class="time-cell break-cell" colspan="${data.activeDays.length + 1}">
              <span class="break-icon">☕</span> ${breakLabel}
              <span class="break-time">${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}</span>
            </td>
          </tr>
        `;
      }

      const cells = data.activeDays
        .map((dayNum) => {
          const dayData = data.days[dayNum];
          const slotData = dayData?.slots[slotIdx];
          const entry = slotData?.entry;

          if (!entry?.subject_name) {
            return '<td class="entry-cell empty-cell">—</td>';
          }

          const colors = subjectColors[entry.subject_name];
          const cellStyle = isColor
            ? `background-color: ${colors.bg}; border-left: 3px solid ${colors.border};`
            : 'background-color: #f9fafb; border-left: 3px solid #6b7280;';

          return `
            <td class="entry-cell" style="${cellStyle}">
              <div class="subject-name">${entry.subject_name}</div>
              ${entry.teacher_name ? `<div class="teacher-name">${entry.teacher_name}</div>` : ''}
              ${entry.room ? `<div class="room-info">Room: ${entry.room}</div>` : ''}
            </td>
          `;
        })
        .join('');

      return `
        <tr>
          <td class="time-cell">
            <div class="slot-label">${slot.slot_label}</div>
            <div class="slot-time">${formatTime(slot.start_time)}</div>
            <div class="slot-time">${formatTime(slot.end_time)}</div>
          </td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  const dayHeaders = data.activeDays
    .map(
      (dayNum) => `
      <th class="day-header">${DAY_LABELS[dayNum]}</th>
    `
    )
    .join('');

  // Legend for subjects (only in color mode)
  const legendItems = isColor
    ? Object.entries(subjectColors)
        .map(
          ([name, colors]) => `
          <span class="legend-item" style="background-color: ${colors.bg}; border-color: ${colors.border};">
            ${name}
          </span>
        `
        )
        .join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title} - Timetable</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #1f2937;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid ${isColor ? '#6366f1' : '#374151'};
        }
        
        .header h1 {
          font-size: 20px;
          font-weight: 700;
          color: ${isColor ? '#4f46e5' : '#111827'};
          margin-bottom: 4px;
        }
        
        .header .subtitle {
          font-size: 14px;
          color: #6b7280;
        }
        
        .header .org-info {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 6px;
          text-align: center;
          vertical-align: middle;
        }
        
        .day-header {
          background-color: ${isColor ? '#6366f1' : '#374151'};
          color: white;
          font-weight: 600;
          font-size: 12px;
          padding: 10px;
        }
        
        .time-header {
          background-color: ${isColor ? '#4f46e5' : '#1f2937'};
          color: white;
          font-weight: 600;
          width: 80px;
        }
        
        .time-cell {
          background-color: #f9fafb;
          font-size: 10px;
          width: 80px;
          padding: 6px;
        }
        
        .slot-label {
          font-weight: 600;
          color: #374151;
        }
        
        .slot-time {
          color: #6b7280;
          font-size: 9px;
        }
        
        .entry-cell {
          padding: 8px 6px;
          min-height: 60px;
          vertical-align: top;
          text-align: left;
        }
        
        .empty-cell {
          color: #d1d5db;
          text-align: center;
        }
        
        .subject-name {
          font-weight: 600;
          font-size: 11px;
          margin-bottom: 2px;
        }
        
        .teacher-name {
          font-size: 10px;
          color: #4b5563;
        }
        
        .room-info {
          font-size: 9px;
          color: #6b7280;
          margin-top: 2px;
        }
        
        .break-row {
          background-color: #fef3c7;
        }
        
        .break-cell {
          text-align: center !important;
          font-style: italic;
          color: #92400e;
          padding: 8px;
        }
        
        .break-icon {
          margin-right: 4px;
        }
        
        .break-time {
          font-size: 10px;
          color: #b45309;
          margin-left: 8px;
        }
        
        .legend {
          margin-top: 15px;
          padding: 10px;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        
        .legend-title {
          font-weight: 600;
          font-size: 11px;
          margin-bottom: 8px;
          color: #374151;
        }
        
        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .legend-item {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          border-left: 3px solid;
        }
        
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          @page {
            size: landscape;
            margin: 15mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
        ${data.organization ? `<div class="org-info">${data.organization}</div>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="time-header">Time</th>
            ${dayHeaders}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      ${
        isColor && legendItems
          ? `
        <div class="legend">
          <div class="legend-title">Subject Legend</div>
          <div class="legend-items">
            ${legendItems}
          </div>
        </div>
      `
          : ''
      }
      
      <div class="footer">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        ${data.generatedAt ? ` • ${data.generatedAt}` : ''}
      </div>
    </body>
    </html>
  `;
}

export default TimetablePdfExport;
