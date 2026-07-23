import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Trophy, ChevronRight, Award, Target, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, SubjectAvatar } from '@/components/common';
import { useStudentExamSessions, useExamSessionDetail } from './hooks';
import type { ExamSession, ExamResult } from './api';

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return '—';
  }
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) {
    return '—';
  }
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(timeStr: string | null) {
  if (!timeStr) {
    return '';
  }
  const [h, m] = timeStr.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function isCompleted(session: ExamSession) {
  return new Date(session.end_date) < new Date();
}

export default function StudentExamsPage() {
  const { data: sessions, isLoading } = useStudentExamSessions();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'results' | 'schedule'>('list');
  const { data: detail, isLoading: detailLoading } = useExamSessionDetail(selectedSession);

  const completedSessions = sessions?.filter(isCompleted) ?? [];
  const upcomingSessions = sessions?.filter((s) => !isCompleted(s)) ?? [];

  const handleViewResults = (publicId: string) => {
    setSelectedSession(publicId);
    setViewMode('results');
  };

  const handleViewSchedule = (publicId: string) => {
    setSelectedSession(publicId);
    setViewMode('schedule');
  };

  const handleBack = () => {
    setSelectedSession(null);
    setViewMode('list');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams & Results"
        description="Your exam sessions, schedules and report cards 🏆"
        icon={FileText}
      />

      {(() => {
        if (isLoading) {
          return (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          );
        }
        if (viewMode === 'list') {
          return (
            <div className="space-y-6">
              {/* Upcoming Exams - Show First */}
              <Card className="overflow-hidden border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-blue-500" />
                    Upcoming Exams
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <div
                          key={session.public_id}
                          role="button"
                          tabIndex={0}
                          className="flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-all hover:bg-blue-50 hover:shadow-sm"
                          onClick={() => handleViewSchedule(session.public_id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleViewSchedule(session.public_id);
                            }
                          }}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                            <span className="text-xl">📋</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-800">{session.name}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatShortDate(session.start_date)} —{' '}
                              {formatShortDate(session.end_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700">View Schedule</Badge>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-6 text-center">
                      <span className="text-3xl">🎉</span>
                      <p className="text-sm text-gray-500">
                        No upcoming exams — relax and prepare!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Exams */}
              <Card className="overflow-hidden border-emerald-200">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Completed Exams
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {completedSessions.length > 0 ? (
                    <div className="space-y-3">
                      {completedSessions.map((session) => (
                        <div
                          key={session.public_id}
                          role="button"
                          tabIndex={0}
                          className="flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-all hover:bg-emerald-50 hover:shadow-sm"
                          onClick={() => handleViewResults(session.public_id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleViewResults(session.public_id);
                            }
                          }}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-100">
                            <span className="text-xl">🏆</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-800">{session.name}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatShortDate(session.start_date)} —{' '}
                              {formatShortDate(session.end_date)}
                              {session.session_type && (
                                <Badge className="ml-2 bg-violet-100 text-[10px] text-violet-700">
                                  {session.session_type}
                                </Badge>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-700">View Results</Badge>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-6 text-center">
                      <span className="text-3xl">🌱</span>
                      <p className="text-sm text-gray-500">No completed exams yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }
        return (
          /* Detail View (Results or Schedule) */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to exams
            </button>

            {(() => {
              if (detailLoading) {
                return <Skeleton className="h-96 rounded-xl" />;
              }
              if (!detail) {
                return (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                      <span className="text-4xl">📭</span>
                      <p className="text-sm text-gray-500">No data available</p>
                    </CardContent>
                  </Card>
                );
              }
              if (viewMode === 'schedule') {
                return <ScheduleView detail={detail} />;
              }
              return <ResultsView detail={detail} />;
            })()}
          </motion.div>
        );
      })()}
    </div>
  );
}

type ExamSessionDetailData = NonNullable<ReturnType<typeof useExamSessionDetail>['data']>;

function ScheduleView({ detail }: Readonly<{ detail: ExamSessionDetailData }>) {
  return (
    /* Schedule View */
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-lg">{detail.name}</CardTitle>
        <p className="text-sm text-gray-500">
          📅 {formatDate(detail.start_date)} — {formatDate(detail.end_date)}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="hidden gap-2 border-b bg-gray-50/80 px-4 py-3 text-xs font-semibold tracking-wider text-gray-500 uppercase sm:grid sm:grid-cols-[2fr_1fr_1fr_1.5fr_1fr]">
          <span>Subject</span>
          <span>Date</span>
          <span>Time</span>
          <span>Teacher</span>
          <span className="text-right">Marks</span>
        </div>
        {/* Rows */}
        <div className="divide-y">
          {detail.exams.map((exam, idx) => {
            return (
              <motion.div
                key={exam.exam_public_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-blue-50/40 sm:grid-cols-[2fr_1fr_1fr_1.5fr_1fr] sm:items-center"
              >
                {/* Subject */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
                    {idx + 1}
                  </div>
                  <SubjectAvatar name={exam.subject_name} size="md" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{exam.subject_name}</p>
                  </div>
                </div>
                {/* Date */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 sm:flex-col sm:items-start sm:gap-0">
                  <Calendar className="h-3.5 w-3.5 text-gray-400 sm:hidden" />
                  <span className="font-medium">
                    {exam.date ? formatShortDate(exam.date) : 'TBD'}
                  </span>
                  {exam.date && (
                    <span className="text-xs text-gray-400">
                      {new Date(exam.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                      })}
                    </span>
                  )}
                </div>
                {/* Time */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 sm:flex-col sm:items-start sm:gap-0">
                  <Clock className="h-3.5 w-3.5 text-gray-400 sm:hidden" />
                  {exam.start_time ? (
                    <>
                      <span className="font-medium">{formatTime(exam.start_time)}</span>
                      {exam.end_time && (
                        <span className="text-xs text-gray-400">
                          to {formatTime(exam.end_time)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                {/* Teacher */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User className="h-3.5 w-3.5 text-gray-400 sm:hidden" />
                  <span className={exam.teacher_name ? '' : 'text-gray-400'}>
                    {exam.teacher_name || '—'}
                  </span>
                </div>
                {/* Marks */}
                <div className="flex items-center justify-end gap-2 sm:flex-col sm:items-end sm:gap-0">
                  <Badge variant="outline" className="text-xs font-medium">
                    Max: {exam.max_marks}
                  </Badge>
                  <span className="text-xs text-gray-400">Pass: {exam.passing_marks}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
        {detail.exams.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-12">
            <span className="text-3xl">📭</span>
            <p className="text-sm text-gray-500">No exams scheduled yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultsView({ detail }: Readonly<{ detail: ExamSessionDetailData }>) {
  return (
    <>
      {/* Overall Stats Banner */}
      <Card className="overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold">{detail.name}</h2>
          <p className="mt-1 text-sm text-white/70">
            {formatShortDate(detail.start_date)} — {formatShortDate(detail.end_date)}
          </p>
          {(() => {
            const appeared = detail.exams.filter((e) => !e.is_absent);
            const totalMax = appeared.reduce((s, e) => s + e.max_marks, 0);
            const totalObtained = appeared.reduce((s, e) => s + (e.marks_obtained ?? 0), 0);
            const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
            const hasAbsent = detail.exams.some((e) => e.is_absent);
            return (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/15 p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold">{pct.toFixed(1)}%</p>
                  <p className="text-xs text-white/70">Overall</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold">{detail.overall_grade || '—'}</p>
                  <p className="text-xs text-white/70">Grade</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold">{hasAbsent ? '❌' : '✅'}</p>
                  <p className="text-xs text-white/70">{hasAbsent ? 'Fail' : 'Pass'}</p>
                </div>
                <div className="rounded-xl bg-white/15 p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold">
                    {appeared.length}/{detail.exams.length}
                  </p>
                  <p className="text-xs text-white/70">Appeared</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Subject-wise Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Subject-wise Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.exams.map((exam) => (
            <SubjectResultRow key={exam.exam_public_id} exam={exam} />
          ))}

          {detail.exams.length > 0 &&
            (() => {
              const appeared = detail.exams.filter((e) => !e.is_absent);
              const totalObtained = appeared.reduce((s, e) => s + (e.marks_obtained ?? 0), 0);
              const totalMax = appeared.reduce((s, e) => s + e.max_marks, 0);
              const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
              return (
                <div className="mt-6 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-violet-600" />
                      <span className="font-semibold text-gray-800">Total</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {totalObtained.toFixed(0)}/{totalMax.toFixed(0)}
                      </span>
                      <Badge
                        className={
                          pct >= 60
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }
                      >
                        {pct.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })()}
        </CardContent>
      </Card>
    </>
  );
}

function SubjectResultRow({ exam }: { readonly exam: ExamResult }) {
  const percentage = exam.percentage ?? 0;
  const passed = exam.passed;

  const barColor = exam.is_absent
    ? 'bg-gray-300'
    : passed
      ? 'bg-gradient-to-r from-emerald-400 to-green-500'
      : 'bg-gradient-to-r from-orange-400 to-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SubjectAvatar name={exam.subject_name} size="md" />
          <span className="text-sm font-medium text-gray-800">{exam.subject_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {exam.is_absent ? (
            <Badge className="bg-gray-100 text-gray-600">Absent</Badge>
          ) : (
            <>
              <span className="font-semibold text-gray-700">
                {exam.marks_obtained ?? 0}/{exam.max_marks}
              </span>
              <Badge
                className={passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
              >
                {exam.grade || `${percentage.toFixed(0)}%`}
              </Badge>
            </>
          )}
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${exam.is_absent ? 0 : percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}
