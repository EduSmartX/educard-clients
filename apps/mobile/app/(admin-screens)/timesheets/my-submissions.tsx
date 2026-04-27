/**
 * My Timesheet Submissions Screen
 * Two modes:
 *  1. Weekly view — fill in daily attendance (morning/afternoon) for a week, then submit
 *  2. History — list of past timesheet submissions with status filters
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Send,
  FileText,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import {
  useEmployeeAttendance,
  useSubmitTimesheet,
  useTimesheetSubmissions,
  useCheckTimesheetStatus,
  useOrganizationHolidays,
} from '@/features/attendance';
import type { EmployeeAttendanceRecord } from '@/features/attendance';
import { headerStyles, layoutStyles, emptyStyles } from '@/styles';

const empGradient = getRoleGradient('employee');

// ============================================================================
// Helpers
// ============================================================================

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDaysUtil(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtShort(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtDay(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
}

function fmtFull(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface DayRow {
  date: string;
  morning_present: boolean;
  afternoon_present: boolean;
  locked: boolean;
  lockReason: string;
  isHoliday: boolean;
  isLeave: boolean;
  leaveType?: string | null;
  isFuture: boolean;
}

const TABS = [
  { key: 'weekly' as const, label: 'Weekly Submit' },
  { key: 'history' as const, label: 'History' },
];
type Tab = 'weekly' | 'history';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  SUBMITTED: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  APPROVED: { bg: '#d1fae5', text: '#065f46', dot: '#059669' },
  RETURNED: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
  DRAFT: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

const HISTORY_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Returned', value: 'RETURNED' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function MyTimesheetSubmissionsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('weekly');
  const [refreshing, setRefreshing] = useState(false);

  // ----- Weekly tab -----
  const [weekMonday, setWeekMonday] = useState<Date>(() => addDaysUtil(getMonday(new Date()), -7));

  const weekStart = fmtISO(weekMonday);
  const weekEnd = fmtISO(addDaysUtil(weekMonday, 6));

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const {
    data: attendanceData,
    isLoading: loadingAttendance,
    refetch: refetchAtt,
  } = useEmployeeAttendance(weekStart, weekEnd);
  const { data: holidayData } = useOrganizationHolidays(weekStart, weekEnd);
  const { data: statusData, refetch: refetchStatus } = useCheckTimesheetStatus(weekStart, weekEnd);

  const submissionStatus =
    statusData?.submission?.submission_status || statusData?.submission_status || null;
  const isAlreadySubmitted = submissionStatus === 'SUBMITTED' || submissionStatus === 'APPROVED';

  const submitMutation = useSubmitTimesheet();

  const [dayRows, setDayRows] = useState<DayRow[]>([]);

  useEffect(() => {
    const records = attendanceData?.records || [];
    const recordMap = new Map<string, EmployeeAttendanceRecord>();
    records.forEach((r) => recordMap.set(r.date, r));

    const holidaySet = new Set<string>();
    (holidayData || []).forEach((h) => {
      const start = new Date(h.start_date + 'T00:00:00');
      const end = new Date(h.end_date + 'T00:00:00');
      for (let d = new Date(start); d <= end; d = addDaysUtil(d, 1)) {
        holidaySet.add(fmtISO(d));
      }
    });

    const policy = attendanceData?.working_day_policy;
    const rows: DayRow[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDaysUtil(weekMonday, i);
      const dateStr = fmtISO(d);
      const dayOfWeek = d.getDay();
      const rec = recordMap.get(dateStr);
      const isFuture = d > todayDate;

      let isHoliday = holidaySet.has(dateStr);
      let lockReason = '';

      if (dayOfWeek === 0 && policy?.sunday_off !== false) {
        isHoliday = true;
        lockReason = 'Sunday';
      }
      if (dayOfWeek === 6) {
        const pattern = policy?.saturday_off_pattern || 'ALL';
        if (pattern === 'ALL') {
          isHoliday = true;
          lockReason = 'Saturday';
        }
      }
      if (isHoliday && !lockReason) lockReason = 'Holiday';

      const isLeave = rec?.is_leave === true || rec?.leave_status === 'approved';
      if (isLeave) lockReason = rec?.leave_type_name || 'Leave';
      if (isFuture) lockReason = 'Future';

      const locked = isHoliday || isLeave || isFuture;

      rows.push({
        date: dateStr,
        morning_present: rec ? rec.morning_present : !locked,
        afternoon_present: rec ? rec.afternoon_present : !locked,
        locked,
        lockReason,
        isHoliday,
        isLeave,
        leaveType: rec?.leave_type_name,
        isFuture,
      });
    }
    setDayRows(rows);
  }, [attendanceData, holidayData, weekMonday, todayDate]);

  const toggleField = (date: string, field: 'morning_present' | 'afternoon_present') => {
    setDayRows((prev) =>
      prev.map((r) => (r.date === date && !r.locked ? { ...r, [field]: !r[field] } : r))
    );
  };

  const editableRows = dayRows.filter((r) => !r.locked);

  const handleSubmitWeek = () => {
    if (editableRows.length === 0) {
      Alert.alert('No Records', 'No editable attendance records for this week.');
      return;
    }
    Alert.alert(
      'Submit Timesheet',
      `Submit for ${fmtShort(weekStart)} – ${fmtShort(weekEnd)}?\nThis will send your timesheet for approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () =>
            submitMutation.mutate(
              {
                attendance_records: editableRows.map((r) => ({
                  date: r.date,
                  morning_present: r.morning_present,
                  afternoon_present: r.afternoon_present,
                })),
                week_start_date: weekStart,
                week_end_date: weekEnd,
                submit_timesheet: true,
              },
              {
                onSuccess: () => {
                  refetchAtt();
                  refetchStatus();
                },
              }
            ),
        },
      ]
    );
  };

  const goWeek = (dir: -1 | 1) => setWeekMonday((p) => addDaysUtil(p, dir * 7));
  const canGoForward = addDaysUtil(weekMonday, 7) <= getMonday(new Date());

  // Stats
  const presentCount = dayRows.filter(
    (r) => !r.locked && r.morning_present && r.afternoon_present
  ).length;
  const halfDayCount = dayRows.filter(
    (r) => !r.locked && r.morning_present !== r.afternoon_present
  ).length;
  const absentCount = dayRows.filter(
    (r) => !r.locked && !r.morning_present && !r.afternoon_present
  ).length;
  const offCount = dayRows.filter((r) => r.isHoliday || r.isFuture).length;
  const leaveCount = dayRows.filter((r) => r.isLeave).length;

  // ----- History tab -----
  const [histFilter, setHistFilter] = useState('');
  const histParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (histFilter) p.submission_status = histFilter;
    return p;
  }, [histFilter]);
  const {
    data: histData,
    isLoading: loadingHist,
    refetch: refetchHist,
  } = useTimesheetSubmissions(histParams);
  const submissions = histData?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (tab === 'weekly') await Promise.all([refetchAtt(), refetchStatus()]);
    else await refetchHist();
    setRefreshing(false);
  }, [tab, refetchAtt, refetchStatus, refetchHist]);

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={empGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>My Timesheets</Text>
              <Text style={headerStyles.subtitle}>Submit & track attendance</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {/* Tab toggle */}
      <View style={st.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[st.tabBtn, tab === t.key && st.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[st.tabText, tab === t.key && st.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'weekly' ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Week navigator */}
          <View style={st.weekNav}>
            <TouchableOpacity onPress={() => goWeek(-1)} style={st.navBtn}>
              <ChevronLeft size={20} color="#6366f1" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={st.weekLabel}>
                {fmtFull(weekStart)} — {fmtFull(weekEnd)}
              </Text>
              {isAlreadySubmitted && (
                <View
                  style={[
                    st.miniBadge,
                    { backgroundColor: submissionStatus === 'APPROVED' ? '#d1fae5' : '#fef3c7' },
                  ]}
                >
                  <Text
                    style={[
                      st.miniBadgeText,
                      { color: submissionStatus === 'APPROVED' ? '#065f46' : '#92400e' },
                    ]}
                  >
                    {submissionStatus}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => goWeek(1)}
              style={[st.navBtn, !canGoForward && { opacity: 0.3 }]}
              disabled={!canGoForward}
            >
              <ChevronRight size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {loadingAttendance ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : (
            <>
              {/* Stats */}
              <View style={st.statsRow}>
                <StatPill label="Present" value={presentCount} color="#059669" />
                <StatPill label="Half" value={halfDayCount} color="#f59e0b" />
                <StatPill label="Absent" value={absentCount} color="#dc2626" />
                <StatPill label="Off" value={offCount} color="#94a3b8" />
                {leaveCount > 0 && <StatPill label="Leave" value={leaveCount} color="#8b5cf6" />}
              </View>

              {/* Day cards */}
              {dayRows.map((row) => (
                <View
                  key={row.date}
                  style={[
                    st.dayCard,
                    row.locked && st.dayCardLocked,
                    row.isLeave && st.dayCardLeave,
                  ]}
                >
                  <View style={st.dayHeader}>
                    <View>
                      <Text style={st.dayName}>{fmtDay(row.date)}</Text>
                      <Text style={st.dayDate}>{fmtShort(row.date)}</Text>
                    </View>
                    {row.locked ? (
                      <View style={st.lockBadge}>
                        <Text style={st.lockText}>{row.lockReason}</Text>
                      </View>
                    ) : (
                      <View style={st.sessionRow}>
                        <SessBtn
                          label="AM"
                          icon={<Sun size={14} color={row.morning_present ? '#fff' : '#f59e0b'} />}
                          active={row.morning_present}
                          disabled={isAlreadySubmitted}
                          onPress={() => toggleField(row.date, 'morning_present')}
                        />
                        <SessBtn
                          label="PM"
                          icon={
                            <Moon size={14} color={row.afternoon_present ? '#fff' : '#6366f1'} />
                          }
                          active={row.afternoon_present}
                          disabled={isAlreadySubmitted}
                          onPress={() => toggleField(row.date, 'afternoon_present')}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Submit button */}
              {!isAlreadySubmitted && editableRows.length > 0 && (
                <TouchableOpacity
                  style={[st.submitBtn, submitMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleSubmitWeek}
                  disabled={submitMutation.isPending}
                  activeOpacity={0.8}
                >
                  {submitMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={18} color="#fff" />
                  )}
                  <Text style={st.submitBtnText}>Submit Timesheet for Approval</Text>
                </TouchableOpacity>
              )}

              {isAlreadySubmitted && (
                <View style={st.infoBox}>
                  <CheckCircle size={18} color="#059669" />
                  <Text style={st.infoText}>
                    This week has been {submissionStatus?.toLowerCase()}.
                    {submissionStatus === 'SUBMITTED' ? ' Awaiting review.' : ''}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        /* ---- History ---- */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={st.filterRow}>
            {HISTORY_FILTERS.map((f) => {
              const active = f.value === histFilter;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[st.chip, active && st.chipActive]}
                  onPress={() => setHistFilter(f.value)}
                >
                  <Text style={[st.chipText, active && st.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loadingHist ? (
            <View style={emptyStyles.container}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : submissions.length === 0 ? (
            <View style={emptyStyles.container}>
              <FileText size={48} color="#94a3b8" />
              <Text style={emptyStyles.title}>No Submissions</Text>
              <Text style={emptyStyles.subtitle}>No timesheets found.</Text>
            </View>
          ) : (
            <View style={{ padding: 16, gap: 10 }}>
              {submissions.map((item: any) => {
                const c = STATUS_COLORS[item.submission_status] || STATUS_COLORS.DRAFT;
                return (
                  <View key={item.public_id} style={st.histCard}>
                    <View style={st.histHeader}>
                      <Text style={st.histWeek}>
                        {fmtShort(item.week_start_date)} – {fmtShort(item.week_end_date)}
                      </Text>
                      <View style={[st.histBadge, { backgroundColor: c.bg }]}>
                        <View style={[st.histDot, { backgroundColor: c.dot }]} />
                        <Text style={[st.histBadgeText, { color: c.text }]}>
                          {item.submission_status}
                        </Text>
                      </View>
                    </View>
                    <View style={st.histStats}>
                      <MiniStat label="Working" val={item.total_working_days} color="#6366f1" />
                      <MiniStat label="Present" val={item.total_present} color="#059669" />
                      <MiniStat label="Absent" val={item.total_absent} color="#dc2626" />
                      <MiniStat label="Holiday" val={item.total_holidays} color="#f59e0b" />
                      <MiniStat label="Leave" val={item.total_leaves} color="#8b5cf6" />
                    </View>
                    {item.review_comments ? (
                      <Text style={st.reviewComment} numberOfLines={2}>
                        💬 {item.review_comments}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function SessBtn({
  label,
  icon,
  active,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[st.sessBtn, active ? st.sessBtnOn : st.sessBtnOff, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[st.sessBtnLabel, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={st.statPill}>
      <Text style={[st.statPillVal, { color }]}>{value}</Text>
      <Text style={st.statPillLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color }}>{val}</Text>
      <Text style={{ fontSize: 10, color: '#94a3b8' }}>{label}</Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const st = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  weekNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  miniBadge: { marginTop: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6 },
  miniBadgeText: { fontSize: 10, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  statPill: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  statPillVal: { fontSize: 16, fontWeight: '800' },
  statPillLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  dayCardLocked: { backgroundColor: '#f8fafc', opacity: 0.7 },
  dayCardLeave: { borderLeftWidth: 3, borderLeftColor: '#8b5cf6' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  dayDate: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  lockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  lockText: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  sessionRow: { flexDirection: 'row', gap: 8 },

  sessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  sessBtnOn: { backgroundColor: '#059669', borderColor: '#059669' },
  sessBtnOff: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  sessBtnLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#065f46', lineHeight: 18 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },

  histCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  histHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  histWeek: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  histBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  histDot: { width: 6, height: 6, borderRadius: 3 },
  histBadgeText: { fontSize: 11, fontWeight: '700' },
  histStats: { flexDirection: 'row', gap: 4 },
  reviewComment: { marginTop: 8, fontSize: 12, color: '#64748b', fontStyle: 'italic' },
});
