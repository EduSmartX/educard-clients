/**
 * Student Marks — subject-wise results per exam session, mirroring the
 * admin student-wise marks display.
 */

import { Award, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';

import { FormDropdown } from '@/components/forms';
import { colors } from '@/constants/colors';
import { getSubjectVisual } from '@/constants/subject-visuals';
import {
  useExamSessionDetail,
  useExamSessions,
  type ExamResult,
  type ExamSession,
} from '@/features/student-portal';

import { academicsStyles as s } from './academics-styles';
import { safeFormat } from './academics-utils';

function toNumber(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function MarksSection() {
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isRefetching,
    refetch,
  } = useExamSessions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Most recent session first; marks are only meaningful for started sessions.
  const orderedSessions = useMemo(() => {
    return [...(sessions ?? [])].sort((a: ExamSession, b: ExamSession) =>
      b.start_date.localeCompare(a.start_date),
    );
  }, [sessions]);

  const activeId = selectedId ?? orderedSessions[0]?.public_id ?? null;
  const { data: detail, isLoading: detailLoading } =
    useExamSessionDetail(activeId);

  const sessionOptions = useMemo(
    () =>
      orderedSessions.map((session: ExamSession) => ({
        label: session.academic_year_name
          ? `${session.name} (${session.academic_year_name})`
          : session.name,
        value: session.public_id,
      })),
    [orderedSessions],
  );

  const graded = (detail?.exams ?? []).filter(
    (exam: ExamResult) => exam.marks_obtained != null && !exam.is_absent,
  );
  const totalMax = graded.reduce(
    (sum, exam) => sum + toNumber(exam.max_marks),
    0,
  );
  const totalObtained = graded.reduce(
    (sum, exam) => sum + toNumber(exam.marks_obtained),
    0,
  );

  if (sessionsLoading) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.stateCard}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={s.stateTitle}>Loading marks</Text>
        </View>
      </ScrollView>
    );
  }

  if (orderedSessions.length === 0) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.stateCard}>
          <Award size={32} color="#94a3b8" />
          <Text style={s.stateTitle}>No marks published yet</Text>
          <Text style={s.stateMessage}>
            Your results will appear here once the school publishes them.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const renderSubjects = () => {
    if (detailLoading) {
      return (
        <View style={s.stateCard}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={s.stateTitle}>Loading results</Text>
        </View>
      );
    }

    if (!detail || detail.exams.length === 0) {
      return (
        <View style={s.stateCard}>
          <Award size={32} color="#94a3b8" />
          <Text style={s.stateTitle}>Results not published</Text>
          <Text style={s.stateMessage}>
            Marks for this exam session have not been released yet.
          </Text>
        </View>
      );
    }

    return detail.exams.map((exam: ExamResult) => {
      const max = toNumber(exam.max_marks);
      const obtained = toNumber(exam.marks_obtained);
      const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;
      const passing = toNumber(exam.passing_marks);
      const failed = !exam.is_absent && passing > 0 && obtained < passing;
      const barColor = exam.is_absent
        ? '#94a3b8'
        : failed
          ? '#ef4444'
          : '#10b981';
      const visual = getSubjectVisual(exam.subject_name);
      const SubjectIcon = visual.icon;

      return (
        <View
          key={exam.exam_public_id}
          style={[
            m.subjectCard,
            { backgroundColor: visual.soft, borderColor: visual.accent },
          ]}
        >
          <View style={m.subjectTop}>
            <View style={m.subjectHead}>
              {visual.image ? (
                <View style={m.subjectAvatar}>
                  <Image
                    source={visual.image}
                    style={m.subjectAvatarImage}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View
                  style={[m.subjectAvatar, { backgroundColor: visual.accent }]}
                >
                  <SubjectIcon size={18} color="#fff" />
                </View>
              )}
              <Text style={m.subjectName}>{exam.subject_name}</Text>
            </View>
            {exam.is_absent ? (
              <View style={[m.markBadge, m.absentBadge]}>
                <Text style={[m.markBadgeText, m.absentText]}>Absent</Text>
              </View>
            ) : (
              <Text style={m.markValue}>
                {exam.marks_obtained ?? 0}
                <Text style={m.markMax}> / {exam.max_marks}</Text>
              </Text>
            )}
          </View>

          <View style={m.track}>
            <View
              style={[
                m.trackFill,
                { width: `${Math.min(100, pct)}%`, backgroundColor: barColor },
              ]}
            />
          </View>

          <View style={m.subjectMeta}>
            <Text style={m.metaText}>
              {exam.is_absent ? 'Not appeared' : `${pct}%`}
              {exam.grade ? ` • Grade ${exam.grade}` : ''}
            </Text>
            <Text style={m.metaText}>
              {exam.date ? safeFormat(exam.date, 'd MMM yyyy') : ''}
            </Text>
          </View>
        </View>
      );
    });
  };

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      }
    >
      <FormDropdown
        label="Exam session"
        options={sessionOptions}
        value={activeId ?? ''}
        onChange={setSelectedId}
        placeholder="Select exam session"
        searchable={orderedSessions.length > 5}
      />

      {!!detail && (
        <View style={m.summaryCard}>
          <View style={m.summaryRow}>
            <View style={m.summaryItem}>
              <Text style={m.summaryValue}>
                {Math.round(toNumber(detail.overall_percentage))}%
              </Text>
              <Text style={m.summaryLabel}>Overall</Text>
            </View>
            <View style={m.summaryDivider} />
            <View style={m.summaryItem}>
              <Text style={m.summaryValue}>{detail.overall_grade || '—'}</Text>
              <Text style={m.summaryLabel}>Grade</Text>
            </View>
            <View style={m.summaryDivider} />
            <View style={m.summaryItem}>
              <Text style={m.summaryValue}>
                {detail.rank ? `#${detail.rank}` : '—'}
              </Text>
              <Text style={m.summaryLabel}>
                {detail.rank && detail.total_students
                  ? `of ${detail.total_students}`
                  : 'Rank'}
              </Text>
            </View>
          </View>

          {graded.length > 0 && (
            <View style={m.totalRow}>
              <TrendingUp size={14} color="#0f766e" />
              <Text style={m.totalText}>
                Total {totalObtained} / {totalMax} across {graded.length}{' '}
                subject{graded.length === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={m.subjectsHeader}>
        <Text style={s.sectionTitle}>Subject-wise marks</Text>
        <ChevronRight size={14} color="#cbd5e1" />
      </View>
      {renderSubjects()}
    </ScrollView>
  );
}

const m = StyleSheet.create({
  summaryCard: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 34, backgroundColor: '#e2e8f0' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  summaryLabel: { marginTop: 3, fontSize: 11, color: '#64748b' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  totalText: { fontSize: 12, fontWeight: '600', color: '#0f766e' },

  subjectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectCard: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
  },
  subjectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectHead: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  subjectAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  subjectAvatarImage: { width: '100%', height: '100%' },
  subjectName: {
    flex: 1,
    paddingRight: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  markValue: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  markMax: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  markBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  absentBadge: { backgroundColor: '#f1f5f9' },
  markBadgeText: { fontSize: 10, fontWeight: '800' },
  absentText: { color: '#64748b' },
  track: {
    height: 7,
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: 4 },
  subjectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: { fontSize: 11, color: '#64748b' },
});
