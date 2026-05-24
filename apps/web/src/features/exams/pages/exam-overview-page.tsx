/**
 * Exam Overview Page - Analytics Dashboard
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Edit,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, WarningConfirmationDialog } from '@/components/common';
import { ROUTES } from '@/constants';
import { useExamSessions, useExams, useMarksOverview } from '../hooks/use-exams';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useUpdateExamStatus, useBulkUpdateExamStatusBySession } from '../hooks/mutations';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExamStatus } from '@educard/shared';

import {
  STATUS_CONFIG,
  INSIGHT_STYLES,
  CHART_COLORS,
  generateAiInsights,
} from './exam-overview-constants';

export function ExamOverviewPage() {
  const navigate = useNavigate();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [pendingBulkStatus, setPendingBulkStatus] = useState<ExamStatus | null>(null);

  // Fetch data
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({ page: 1, page_size: 200 });

  // Only fetch exams when session is selected
  const { data: examsData } = useExams(
    selectedSessionId
      ? { page: 1, page_size: 500, session: selectedSessionId }
      : { page: 1, page_size: 0 } // Don't fetch if no session
  );

  // Fetch marks overview for analytics - only when BOTH are selected
  const marksOverviewParams =
    selectedSessionId && selectedClassId
      ? { session_id: selectedSessionId, class_id: selectedClassId }
      : null;
  const {
    data: marksOverviewData,
    isLoading: isLoadingMarks,
    isError: isMarksError,
  } = useMarksOverview(marksOverviewParams);

  const sessionsList = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const classesList = useMemo(() => classesData?.data || [], [classesData]);
  const examsList = useMemo(() => examsData?.data || [], [examsData]);
  const marksOverview = marksOverviewData?.data;

  const updateExamStatusMutation = useUpdateExamStatus();
  const bulkUpdateMutation = useBulkUpdateExamStatusBySession();

  // Get selected session
  const selectedSession = useMemo(
    () => sessionsList.find((s) => s.public_id === selectedSessionId),
    [sessionsList, selectedSessionId]
  );

  // Filter exams by class if selected
  const filteredExams = useMemo(() => {
    if (!selectedClassId) {
      return examsList;
    }
    return examsList.filter((exam) => exam.class_public_id === selectedClassId);
  }, [examsList, selectedClassId]);

  // Handle individual exam status change
  const handleExamStatusChange = async (examId: string, newStatus: ExamStatus) => {
    try {
      await updateExamStatusMutation.mutateAsync({
        id: examId,
        status: newStatus,
      });
    } catch {
      // Error handled by mutation's onError callback
    }
  };

  // Handle bulk status update for all exams in the session
  const handleBulkStatusUpdate = async (newStatus: ExamStatus) => {
    if (!selectedSessionId) {
      return;
    }

    setPendingBulkStatus(newStatus);
  };

  const confirmBulkStatusUpdate = async () => {
    if (!selectedSessionId || !pendingBulkStatus) {
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        sessionId: selectedSessionId,
        status: pendingBulkStatus,
      });
    } catch {
      // Error handled by mutation's onError callback
    } finally {
      setPendingBulkStatus(null);
    }
  };

  // Prepare chart data for subject-wise pass/fail
  const subjectChartData = useMemo(() => {
    if (!marksOverview?.subjects) {
      return [];
    }
    return marksOverview.subjects.map((subject) => ({
      name:
        subject.subject_name.length > 10
          ? `${subject.subject_name.substring(0, 10)}...`
          : subject.subject_name,
      fullName: subject.subject_name,
      passed: subject.passed,
      failed: subject.failed,
      absent: subject.absent,
      average: subject.average_marks,
    }));
  }, [marksOverview]);

  // Prepare pie chart data for overall class
  const overallPieData = useMemo(() => {
    if (!marksOverview?.stats) {
      return [];
    }
    const { passed_count, failed_count, total_students } = marksOverview.stats;
    const notAttempted = total_students - passed_count - failed_count;
    return [
      { name: 'Passed', value: passed_count, color: CHART_COLORS.passed },
      { name: 'Failed', value: failed_count > 0 ? failed_count : 0, color: CHART_COLORS.failed },
      {
        name: 'Not Attempted',
        value: notAttempted > 0 ? notAttempted : 0,
        color: CHART_COLORS.absent,
      },
    ].filter((item) => item.value > 0);
  }, [marksOverview]);

  // Check if there are any marks entered
  const hasMarksEntered = useMemo(() => {
    if (!marksOverview?.subjects) {
      return false;
    }
    return marksOverview.subjects.some((s) => s.total_students > 0);
  }, [marksOverview]);

  // AI-powered insights generation
  const aiInsights = useMemo(
    () => generateAiInsights(marksOverview, hasMarksEntered),
    [marksOverview, hasMarksEntered]
  );

  // Stats
  const stats = useMemo(() => {
    const total = filteredExams.length;
    const byStatus = {
      draft: filteredExams.filter((e) => e.status === 'draft').length,
      scheduled: filteredExams.filter((e) => e.status === 'scheduled').length,
      in_progress: filteredExams.filter((e) => e.status === 'in_progress').length,
      completed: filteredExams.filter((e) => e.status === 'completed').length,
      cancelled: filteredExams.filter((e) => e.status === 'cancelled').length,
    };
    return { total, byStatus };
  }, [filteredExams]);

  return (
    <div className="space-y-6">
      <PageHeader title="Exam Overview & Analytics" />

      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Session Filter */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700">Exam Session</span>
              <SearchableSelect
                options={sessionsList.map((session) => ({
                  value: session.public_id,
                  label: `${session.name} (${session.academic_year})`,
                }))}
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
                placeholder="Select session"
                searchPlaceholder="Search sessions..."
              />
            </label>

            {/* Class Filter */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700">Class</span>
              <SearchableSelect
                options={classesList.map((cls) => ({
                  value: cls.public_id,
                  label: `${cls.class_master?.name || 'Unknown'} - ${cls.name}`,
                }))}
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                placeholder="Select class"
                searchPlaceholder="Search classes..."
              />
            </label>

            {/* Bulk Status Update */}
            {selectedSessionId && selectedClassId && (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">Bulk Update Status</span>
                <SearchableSelect
                  options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                    value: key,
                    label: `Mark as ${config.label}`,
                  }))}
                  value=""
                  onValueChange={(v) => handleBulkStatusUpdate(v as ExamStatus)}
                  placeholder="Update all exams"
                />
              </label>
            )}
          </div>

          {/* Session Info */}
          {selectedSession && (
            <div className="from-brand-50 to-brand-100 border-brand-200 mt-4 rounded-lg border bg-gradient-to-r p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{selectedSession.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSession.session_type} • {selectedSession.academic_year}
                    {selectedSession.start_date && selectedSession.end_date && (
                      <span className="ml-2">
                        | {format(new Date(selectedSession.start_date), 'dd MMM')} -{' '}
                        {format(new Date(selectedSession.end_date), 'dd MMM yyyy')}
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="px-4 py-1 text-lg">
                  {filteredExams.length} Exams
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on selection */}
      {(!selectedSessionId || !selectedClassId) && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg font-semibold">Select Session and Class</p>
              <p className="mt-2 text-sm">
                Choose an exam session and class to view exams and analytics
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {!!(selectedSessionId && selectedClassId) && filteredExams.length === 0 && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg">No exams found for the selected session and class</p>
            </div>
          </CardContent>
        </Card>
      )}
      {!!(selectedSessionId && selectedClassId) && filteredExams.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Exams Overview
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2"
              disabled={!hasMarksEntered}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Exams Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <BookOpen className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Circle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{stats.byStatus.scheduled}</p>
                      <p className="text-xs text-blue-600">Scheduled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-yellow-100 p-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.byStatus.in_progress}
                      </p>
                      <p className="text-xs text-yellow-600">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.byStatus.completed}
                      </p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{stats.byStatus.cancelled}</p>
                      <p className="text-xs text-red-600">Cancelled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exams Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  {marksOverview?.class_info?.name || 'Class'} - Exams Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">Duration</TableHead>
                        <TableHead className="text-center font-semibold">Max Marks</TableHead>
                        <TableHead className="text-center font-semibold">Passing</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-center font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => {
                        const statusConfig = STATUS_CONFIG[exam.status];
                        return (
                          <TableRow key={exam.public_id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${statusConfig.bgColor}`} />
                                {exam.subject_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {exam.date ? (
                                <span className="flex items-center gap-1.5 text-sm">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  {format(new Date(exam.date), 'dd MMM yyyy')}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {exam.start_time && exam.end_time ? (
                                <span className="flex items-center gap-1.5 text-sm">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  {exam.start_time} - {exam.end_time}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {exam.duration_formatted ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {exam.duration_formatted}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {exam.max_marks}
                            </TableCell>
                            <TableCell className="text-center">{exam.passing_marks}</TableCell>
                            <TableCell>
                              <SearchableSelect
                                options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                                  value: key,
                                  label: config.label,
                                }))}
                                value={exam.status}
                                onValueChange={(v) =>
                                  handleExamStatusChange(exam.public_id, v as ExamStatus)
                                }
                                className={`h-8 w-36 text-xs ${statusConfig.bgColor} border-0`}
                                placeholder="Status"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(ROUTES.EXAMS_EDIT.replace(':id', exam.public_id))
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Info about analytics */}
            {(!selectedSessionId || !selectedClassId) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Select both Session and Class to view analytics.</strong> Analytics
                      require a specific session and class to be selected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {selectedSessionId && selectedClassId && !hasMarksEntered && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      <strong>Analytics available after marks are entered.</strong> Mark exams as
                      "Completed" and enter marks to view detailed analytics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Show message if session or class not selected */}
            {(!selectedSessionId || !selectedClassId) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-blue-100 p-4">
                      <BarChart3 className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">
                        Select Session and Class
                      </h3>
                      <p className="mt-1 max-w-md text-sm text-blue-700">
                        Please select both a <strong>Session</strong> and a <strong>Class</strong>{' '}
                        from the filters above to view analytics.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading state */}
            {selectedSessionId && selectedClassId && isLoadingMarks && (
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="text-brand-600 h-10 w-10 animate-spin" />
                    <p className="text-sm text-gray-600">Loading analytics...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error state */}
            {selectedSessionId && selectedClassId && isMarksError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-red-100 p-4">
                      <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">
                        Failed to Load Analytics
                      </h3>
                      <p className="mt-1 text-sm text-red-700">Please try refreshing the page.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show message if no marks entered */}
            {selectedSessionId &&
              selectedClassId &&
              !isLoadingMarks &&
              !isMarksError &&
              !hasMarksEntered && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="rounded-full bg-yellow-100 p-4">
                        <AlertCircle className="h-10 w-10 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800">
                          No Marks Data Available
                        </h3>
                        <p className="mt-1 max-w-md text-sm text-yellow-700">
                          Analytics will appear here once marks are entered. Go to{' '}
                          <strong>Marks Entry</strong> to add marks for completed exams.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            {marksOverview && hasMarksEntered && (
              <>
                {/* Overall Class Performance */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card className="border-brand-200 from-brand-50 to-brand-100 border-2 bg-gradient-to-br">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-brand-200 rounded-xl p-3">
                          <Users className="text-brand-700 h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-brand-700 text-3xl font-bold">
                            {marksOverview.stats.total_students}
                          </p>
                          <p className="text-brand-600 text-sm">Total Students</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-green-200 p-3">
                          <UserCheck className="h-8 w-8 text-green-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-green-700">
                            {marksOverview.stats.passed_count}
                          </p>
                          <p className="text-sm text-green-600">Passed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-red-200 p-3">
                          <UserX className="h-8 w-8 text-red-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-red-700">
                            {marksOverview.stats.failed_count}
                          </p>
                          <p className="text-sm text-red-600">Failed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-purple-200 p-3">
                          <Award className="h-8 w-8 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-purple-700">
                            {marksOverview.stats.pass_percentage}%
                          </p>
                          <p className="text-sm text-purple-600">Pass Percentage</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                  <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        AI-Powered Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {aiInsights.map((insight) => {
                          const styles = INSIGHT_STYLES[insight.type];
                          const { Icon } = styles;
                          return (
                            <div
                              key={insight.message}
                              className={`rounded-lg border p-4 ${styles.container}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 ${styles.iconColor}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className={`text-sm font-semibold ${styles.titleColor}`}>
                                    {insight.title}
                                  </p>
                                  <p className={`mt-1 text-xs ${styles.descColor}`}>
                                    {insight.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Subject-wise Pass/Fail Bar Chart - Changed to horizontal layout (vertical bars) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="text-brand-600 h-5 w-5" />
                        Subject-wise Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) => {
                                const labels: Record<string, string> = {
                                  passed: 'Passed',
                                  failed: 'Failed',
                                };
                                return [value, labels[name as string] || 'Absent'];
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="passed"
                              name="Passed"
                              fill={CHART_COLORS.passed}
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="failed"
                              name="Failed"
                              fill={CHART_COLORS.failed}
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="absent"
                              name="Absent"
                              fill={CHART_COLORS.absent}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overall Pass/Fail Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PieChartIcon className="text-brand-600 h-5 w-5" />
                        Overall Class Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={overallPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {overallPieData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, name]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject-wise Analytics Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="text-brand-600 h-5 w-5" />
                      Subject-wise Detailed Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Subject</TableHead>
                            <TableHead className="text-center font-semibold">Appeared</TableHead>
                            <TableHead className="text-center font-semibold">Absent</TableHead>
                            <TableHead className="text-center font-semibold">
                              <span className="text-green-600">Passed</span>
                            </TableHead>
                            <TableHead className="text-center font-semibold">
                              <span className="text-red-600">Failed</span>
                            </TableHead>
                            <TableHead className="text-center font-semibold">Pass %</TableHead>
                            <TableHead className="text-center font-semibold">Avg Marks</TableHead>
                            <TableHead className="text-center font-semibold">Highest</TableHead>
                            <TableHead className="text-center font-semibold">Lowest</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marksOverview.subjects.map((subject) => (
                            <TableRow key={subject.exam_public_id} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium">{subject.subject_name}</TableCell>
                              <TableCell className="text-center">{subject.appeared}</TableCell>
                              <TableCell className="text-center">
                                <span className="text-yellow-600">{subject.absent}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-700">
                                  {subject.passed}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-medium text-red-700">
                                  {subject.failed}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`font-semibold ${subject.pass_percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {subject.pass_percentage}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center font-medium">
                                {subject.average_marks}
                              </TableCell>
                              <TableCell className="text-center font-medium text-green-600">
                                {subject.highest_marks}
                              </TableCell>
                              <TableCell className="text-center font-medium text-red-600">
                                {subject.lowest_marks}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      <WarningConfirmationDialog
        open={!!pendingBulkStatus}
        onOpenChange={(open) => !open && setPendingBulkStatus(null)}
        onConfirm={confirmBulkStatusUpdate}
        title="Update Exam Status"
        description={
          pendingBulkStatus
            ? `Are you sure you want to mark all ${filteredExams.length} exam(s) as "${STATUS_CONFIG[pendingBulkStatus].label}"?`
            : ''
        }
        warningText="This will update all exams in the selected session/class view."
        confirmButtonText={bulkUpdateMutation.isPending ? 'Updating...' : 'Yes, Update All'}
        cancelButtonText="Cancel"
        isLoading={bulkUpdateMutation.isPending}
      />
    </div>
  );
}
