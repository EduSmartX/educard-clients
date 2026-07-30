/**
 * TimesheetWeekCard - Expandable week card for weekly timesheet submission.
 * Extracted from my-submissions.tsx to reduce cognitive complexity.
 */

import { format, parseISO } from 'date-fns';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
  X,
} from 'lucide-react-native';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

import type { WeekBlock } from '../types';

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const config: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
    SUBMITTED: { bg: '#dbeafe', text: '#1d4ed8', label: 'Submitted' },
    APPROVED: { bg: '#dcfce7', text: '#16a34a', label: 'Approved' },
    REJECTED: { bg: '#fee2e2', text: '#dc2626', label: 'Rejected' },
  };
  const c = config[status] || config.DRAFT;
  return (
    <View
      style={{ backgroundColor: c.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}
    >
      <Text style={{ fontSize: 10, fontWeight: '600', color: c.text }}>{c.label}</Text>
    </View>
  );
}

function AttendanceToggle({
  label,
  isPresent,
  disabled,
  onToggle,
}: {
  label: string;
  isPresent: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onToggle}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={{
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: isPresent ? '#dcfce7' : '#fee2e2',
        borderColor: isPresent ? '#22c55e' : '#ef4444',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>{label}</Text>
      {isPresent ? (
        <Check size={16} color="#16a34a" strokeWidth={3} />
      ) : (
        <X size={16} color="#dc2626" strokeWidth={3} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export interface TimesheetWeekCardProps {
  weekInfo: { start: Date; end: Date; id: string };
  week: WeekBlock | undefined;
  onExpandToggle: (start: Date, end: Date) => void;
  onToggleAttendance: (
    weekId: string,
    date: string,
    field: 'morning_present' | 'afternoon_present'
  ) => void;
  onSubmit: (week: WeekBlock) => void;
  onReturnToDraft: (week: WeekBlock) => void;
  isSubmitting: boolean;
  isReturningToDraft: boolean;
}

export function TimesheetWeekCard({
  weekInfo,
  week,
  onExpandToggle,
  onToggleAttendance,
  onSubmit,
  onReturnToDraft,
  isSubmitting,
  isReturningToDraft,
}: TimesheetWeekCardProps) {
  const isExpanded = week && !week.collapsed;

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <TouchableOpacity
        onPress={() => onExpandToggle(weekInfo.start, weekInfo.end)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 14,
          backgroundColor: isExpanded ? '#f0fdfa' : 'white',
          borderBottomWidth: isExpanded ? 1 : 0,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={16} color="#0d9488" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
              {format(weekInfo.start, 'MMM d')} - {format(weekInfo.end, 'MMM d, yyyy')}
            </Text>
          </View>
          {week?.submissionStatus && <WeekStatusInfo week={week} />}
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color="#6b7280" />
        ) : (
          <ChevronDown size={20} color="#6b7280" />
        )}
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && week && (
        <View style={{ padding: 12 }}>
          {week.rows.map((row, idx) => (
            <WeekRowItem
              key={row.date}
              row={row}
              isLast={idx === week.rows.length - 1}
              disabled={
                !!row.locked_reason ||
                week.submissionStatus === 'SUBMITTED' ||
                week.submissionStatus === 'APPROVED'
              }
              onToggle={(field) => onToggleAttendance(week.id, row.date, field)}
            />
          ))}
          <WeekActions
            week={week}
            onSubmit={onSubmit}
            onReturnToDraft={onReturnToDraft}
            isSubmitting={isSubmitting}
            isReturningToDraft={isReturningToDraft}
          />
        </View>
      )}
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function WeekStatusInfo({ week }: { week: WeekBlock }) {
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <StatusBadge status={week.submissionStatus} />
        {week.submissionStatus === 'REJECTED' && week.reviewComments && (
          <Text style={{ fontSize: 11, color: '#dc2626', flex: 1 }} numberOfLines={1}>
            {week.reviewComments}
          </Text>
        )}
      </View>
      {(week.submissionStatus === 'APPROVED' || week.submissionStatus === 'REJECTED') &&
        week.reviewedByName && (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}
          >
            <Text style={{ fontSize: 10, color: '#64748b' }}>
              {week.submissionStatus === 'APPROVED' ? '✓ Approved by ' : '✗ Rejected by '}
            </Text>
            <Text style={{ fontSize: 10, color: '#1e40af', fontWeight: '600' }}>
              {week.reviewedByName}
            </Text>
            {!!week.reviewedAt && (
              <Text style={{ fontSize: 10, color: '#64748b' }}>
                {' on '}
                {format(parseISO(week.reviewedAt), 'dd MMM yyyy')}
              </Text>
            )}
          </View>
        )}
    </View>
  );
}

function WeekRowItem({
  row,
  isLast,
  disabled,
  onToggle,
}: {
  row: WeekBlock['rows'][number];
  isLast: boolean;
  disabled: boolean;
  onToggle: (field: 'morning_present' | 'afternoon_present') => void;
}) {
  const isLocked = !!row.locked_reason;
  let lockedBgColor = '#f3f4f6';
  let lockedTextColor = '#6b7280';
  if (row.locked_reason === 'holiday') {
    lockedBgColor = '#f3e8ff';
    lockedTextColor = '#7c3aed';
  } else if (row.locked_reason === 'leave') {
    lockedBgColor = '#ffedd5';
    lockedTextColor = '#ea580c';
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#f3f4f6',
        opacity: isLocked ? 0.6 : 1,
      }}
    >
      <View style={{ width: 70 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>{row.dayName}</Text>
        <Text style={{ fontSize: 11, color: '#9ca3af' }}>
          {format(parseISO(row.date), 'MMM d')}
        </Text>
      </View>
      {isLocked ? (
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <View
            style={{
              backgroundColor: lockedBgColor,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: lockedTextColor }}>
              {row.holiday_name || row.leave_name || 'Non-working day'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 8 }}>
          <AttendanceToggle
            label="AM"
            isPresent={row.morning_present}
            disabled={disabled}
            onToggle={() => onToggle('morning_present')}
          />
          <AttendanceToggle
            label="PM"
            isPresent={row.afternoon_present}
            disabled={disabled}
            onToggle={() => onToggle('afternoon_present')}
          />
        </View>
      )}
    </View>
  );
}

function WeekActions({
  week,
  onSubmit,
  onReturnToDraft,
  isSubmitting,
  isReturningToDraft,
}: {
  week: WeekBlock;
  onSubmit: (week: WeekBlock) => void;
  onReturnToDraft: (week: WeekBlock) => void;
  isSubmitting: boolean;
  isReturningToDraft: boolean;
}) {
  const canSubmit =
    !week.submissionStatus ||
    week.submissionStatus === 'DRAFT' ||
    week.submissionStatus === 'REJECTED';
  const canReturnToDraft =
    week.submissionStatus === 'SUBMITTED' || week.submissionStatus === 'REJECTED';

  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      {canSubmit && (
        <TouchableOpacity
          onPress={() => onSubmit(week)}
          disabled={isSubmitting}
          style={{
            backgroundColor: '#4f46e5',
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Send size={16} color="white" />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Submit Week</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {canReturnToDraft && (
        <TouchableOpacity
          onPress={() => onReturnToDraft(week)}
          disabled={isReturningToDraft}
          style={{
            backgroundColor: '#f3f4f6',
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isReturningToDraft ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <>
              <RotateCcw size={16} color="#6b7280" />
              <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 14 }}>
                Return to Draft
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {week.submissionStatus === 'APPROVED' && (
        <View
          style={{
            backgroundColor: '#dcfce7',
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#16a34a', fontWeight: '600', fontSize: 14 }}>✓ Approved</Text>
        </View>
      )}
    </View>
  );
}
