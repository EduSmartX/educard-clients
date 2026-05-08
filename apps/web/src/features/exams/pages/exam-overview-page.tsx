/**
 * Exam Overview Page - Analytics Dashboard
 * 
 * Features:
 * - Clean tabular view of exams with color coding
 * - Subject-wise analytics (attended, passed, failed, average)
 * - Charts: Bar charts for pass/fail, Pie chart for overall distribution
 * - Overall class pass percentage
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Users, BookOpen, CheckCircle2, Circle, 
  AlertCircle, XCircle, Edit, FileX, TrendingUp, Award,
  BarChart3, PieChart as PieChartIcon, UserCheck, UserX, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common';
import { ROUTES } from '@/constants';
import { useExamSessions, useExams, useMarksOverview } from '../hooks/use-exams';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useUpdateExamStatus, useBulkUpdateExamStatusBySession } from '../hooks/mutations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { ExamStatus } from '../types';

// Status colors and icons
const STATUS_CONFIG: Record<ExamStatus, { color: string; bgColor: string; icon: typeof Circle; label: string }> = {
  draft: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: FileX,
    label: 'Draft',
  },
  scheduled: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Circle,
    label: 'Scheduled',
  },
  in_progress: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: AlertCircle,
    label: 'In Progress',
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    label: 'Completed',
  },
  cancelled: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle,
    label: 'Cancelled',
  },
};

// Chart colors
const CHART_COLORS = {
  passed: '#22c55e',
  failed: '#ef4444',
  absent: '#f59e0b',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
};

export function ExamOverviewPage() {
  const navigate = useNavigate();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');

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
  const marksOverviewParams = selectedSessionId && selectedClassId 
    ? { session_id: selectedSessionId, class_id: selectedClassId }
    : null;
  const { data: marksOverviewData, isLoading: isLoadingMarks, isError: isMarksError } = useMarksOverview(marksOverviewParams);

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
    } catch (error) {
      console.error('Failed to update exam status:', error);
    }
  };

  // Handle bulk status update for all exams in the session
  const handleBulkStatusUpdate = async (newStatus: ExamStatus) => {
    if (!selectedSessionId) {
      return;
    }

    const statusLabel = STATUS_CONFIG[newStatus].label;
    const examCount = filteredExams.length;
    
    const confirmed = window.confirm(
      `Are you sure you want to mark all ${examCount} exam(s) as "${statusLabel}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        sessionId: selectedSessionId,
        status: newStatus,
      });
    } catch (error) {
      console.error('Failed to bulk update exam statuses:', error);
    }
  };

  // Prepare chart data for subject-wise pass/fail
  const subjectChartData = useMemo(() => {
    if (!marksOverview?.subjects) {
      return [];
    }
    return marksOverview.subjects.map(subject => ({
      name: subject.subject_name.length > 10 
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
      { name: 'Not Attempted', value: notAttempted > 0 ? notAttempted : 0, color: CHART_COLORS.absent },
    ].filter(item => item.value > 0);
  }, [marksOverview]);

  // Check if there are any marks entered
  const hasMarksEntered = useMemo(() => {
    if (!marksOverview?.subjects) {
      return false;
    }
    return marksOverview.subjects.some(s => s.total_students > 0);
  }, [marksOverview]);

  // AI-powered insights generation
  const aiInsights = useMemo(() => {
    if (!marksOverview || !hasMarksEntered) {
      return [];
    }

    const insights: { type: 'success' | 'warning' | 'info' | 'alert'; title: string; description: string }[] = [];
    const { stats, subjects } = marksOverview;

    // Overall class performance
    if (stats.pass_percentage >= 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Class Performance!',
        description: `${stats.pass_percentage}% of students passed all subjects. The class is performing exceptionally well.`,
      });
    } else if (stats.pass_percentage >= 60) {
      insights.push({
        type: 'info',
        title: 'Good Class Performance',
        description: `${stats.pass_percentage}% pass rate. Consider additional support for struggling students.`,
      });
    } else if (stats.pass_percentage < 50) {
      insights.push({
        type: 'alert',
        title: 'Attention Required',
        description: `Only ${stats.pass_percentage}% pass rate. Immediate intervention recommended.`,
      });
    }

    // Find best and worst performing subjects
    if (subjects.length > 0) {
      const sortedByPass = [...subjects].sort((a, b) => b.pass_percentage - a.pass_percentage);
      const bestSubject = sortedByPass[0];
      const worstSubject = sortedByPass[sortedByPass.length - 1];

      if (bestSubject.pass_percentage >= 90) {
        insights.push({
          type: 'success',
          title: `Top Performer: ${bestSubject.subject_name}`,
          description: `${bestSubject.pass_percentage}% pass rate with ${bestSubject.average_marks.toFixed(1)} average marks.`,
        });
      }

      if (worstSubject.pass_percentage < 60 && subjects.length > 1) {
        insights.push({
          type: 'warning',
          title: `Needs Improvement: ${worstSubject.subject_name}`,
          description: `Only ${worstSubject.pass_percentage}% pass rate. Consider remedial classes.`,
        });
      }

      // Find subjects with high absence
      const highAbsence = subjects.filter(s => s.absent > s.total_students * 0.1);
      if (highAbsence.length > 0) {
        insights.push({
          type: 'warning',
          title: 'High Absence Rate',
          description: `${highAbsence.map(s => s.subject_name).join(', ')} have more than 10% absence.`,
        });
      }

      // Top scorer analysis
      const topAverageSubject = [...subjects].sort((a, b) => b.average_marks - a.average_marks)[0];
      insights.push({
        type: 'info',
        title: 'Highest Average Score',
        description: `${topAverageSubject.subject_name} has the highest average of ${topAverageSubject.average_marks.toFixed(1)} marks.`,
      });
    }

    return insights;
  }, [marksOverview, hasMarksEntered]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Session Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Exam Session</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessionsList.map((session) => (
                    <SelectItem key={session.public_id} value={session.public_id}>
                      {session.name} ({session.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classesList.map((cls) => (
                    <SelectItem key={cls.public_id} value={cls.public_id}>
                      {cls.class_master.name} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Status Update */}
            {selectedSessionId && selectedClassId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bulk Update Status</label>
                <Select onValueChange={(v) => handleBulkStatusUpdate(v as ExamStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Update all exams" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span>Mark as {config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Session Info */}
          {selectedSession && (
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-brand-50 to-brand-100 border border-brand-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{selectedSession.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSession.session_type} • {selectedSession.academic_year}
                    {selectedSession.start_date && selectedSession.end_date && (
                      <span className="ml-2">
                        | {format(new Date(selectedSession.start_date), 'dd MMM')} - {format(new Date(selectedSession.end_date), 'dd MMM yyyy')}
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {filteredExams.length} Exams
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on selection */}
      {!selectedSessionId || !selectedClassId ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold">Select Session and Class</p>
              <p className="text-sm mt-2">Choose an exam session and class to view exams and analytics</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredExams.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No exams found for the selected session and class</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Exams Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" disabled={!hasMarksEntered}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Exams Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
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
                    <div className="p-2 bg-blue-100 rounded-lg">
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
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.in_progress}</p>
                      <p className="text-xs text-yellow-600">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.byStatus.completed}</p>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {marksOverview?.class_info?.name || 'Class'} - Exams Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">Duration</TableHead>
                        <TableHead className="font-semibold text-center">Max Marks</TableHead>
                        <TableHead className="font-semibold text-center">Passing</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => {
                        const statusConfig = STATUS_CONFIG[exam.status];
                        const StatusIcon = statusConfig.icon;
                        return (
                          <TableRow key={exam.public_id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor}`} />
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
                            <TableCell className="text-center font-semibold">{exam.max_marks}</TableCell>
                            <TableCell className="text-center">{exam.passing_marks}</TableCell>
                            <TableCell>
                              <Select
                                value={exam.status}
                                onValueChange={(v) => handleExamStatusChange(exam.public_id, v as ExamStatus)}
                              >
                                <SelectTrigger className={`w-36 h-8 text-xs ${statusConfig.bgColor} border-0`}>
                                  <div className="flex items-center gap-1.5">
                                    <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
                                    <span className={statusConfig.color}>{statusConfig.label}</span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                    const Icon = config.icon;
                                    return (
                                      <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                          <Icon className={`h-4 w-4 ${config.color}`} />
                                          <span>{config.label}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(ROUTES.EXAMS_EDIT.replace(':id', exam.public_id))}
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
            {!selectedSessionId || !selectedClassId ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Select both Session and Class to view analytics.</strong> Analytics require a specific session and class to be selected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !hasMarksEntered ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      <strong>Analytics available after marks are entered.</strong> Mark exams as "Completed" and enter marks to view detailed analytics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Show message if session or class not selected */}
            {(!selectedSessionId || !selectedClassId) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <BarChart3 className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Select Session and Class</h3>
                      <p className="text-sm text-blue-700 mt-1 max-w-md">
                        Please select both a <strong>Session</strong> and a <strong>Class</strong> from the filters above to view analytics.
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
                    <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
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
                    <div className="p-4 bg-red-100 rounded-full">
                      <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Failed to Load Analytics</h3>
                      <p className="text-sm text-red-700 mt-1">Please try refreshing the page.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show message if no marks entered */}
            {selectedSessionId && selectedClassId && !isLoadingMarks && !isMarksError && !hasMarksEntered && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <div className="p-4 bg-yellow-100 rounded-full">
                      <AlertCircle className="h-10 w-10 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800">No Marks Data Available</h3>
                      <p className="text-sm text-yellow-700 mt-1 max-w-md">
                        Analytics will appear here once marks are entered. Go to <strong>Marks Entry</strong> to add marks for completed exams.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {marksOverview && hasMarksEntered && (
              <>
                {/* Overall Class Performance */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-200 rounded-xl">
                          <Users className="h-8 w-8 text-brand-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-brand-700">{marksOverview.stats.total_students}</p>
                          <p className="text-sm text-brand-600">Total Students</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-200 rounded-xl">
                          <UserCheck className="h-8 w-8 text-green-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-green-700">{marksOverview.stats.passed_count}</p>
                          <p className="text-sm text-green-600">Passed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-200 rounded-xl">
                          <UserX className="h-8 w-8 text-red-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-red-700">{marksOverview.stats.failed_count}</p>
                          <p className="text-sm text-red-600">Failed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-200 rounded-xl">
                          <Award className="h-8 w-8 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-purple-700">{marksOverview.stats.pass_percentage}%</p>
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
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        AI-Powered Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiInsights.map((insight, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                              insight.type === 'success' ? 'bg-green-50 border-green-200' :
                              insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                              insight.type === 'alert' ? 'bg-red-50 border-red-200' :
                              'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${
                                insight.type === 'success' ? 'text-green-600' :
                                insight.type === 'warning' ? 'text-yellow-600' :
                                insight.type === 'alert' ? 'text-red-600' :
                                'text-blue-600'
                              }`}>
                                {insight.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                                 insight.type === 'warning' ? <AlertCircle className="h-5 w-5" /> :
                                 insight.type === 'alert' ? <XCircle className="h-5 w-5" /> :
                                 <TrendingUp className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className={`font-semibold text-sm ${
                                  insight.type === 'success' ? 'text-green-800' :
                                  insight.type === 'warning' ? 'text-yellow-800' :
                                  insight.type === 'alert' ? 'text-red-800' :
                                  'text-blue-800'
                                }`}>
                                  {insight.title}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  insight.type === 'success' ? 'text-green-700' :
                                  insight.type === 'warning' ? 'text-yellow-700' :
                                  insight.type === 'alert' ? 'text-red-700' :
                                  'text-blue-700'
                                }`}>
                                  {insight.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Subject-wise Pass/Fail Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-brand-600" />
                        Subject-wise Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value, name) => [value, name === 'passed' ? 'Passed' : name === 'failed' ? 'Failed' : 'Absent']}
                            />
                            <Legend />
                            <Bar dataKey="passed" name="Passed" fill={CHART_COLORS.passed} radius={[0, 4, 4, 0]} />
                            <Bar dataKey="failed" name="Failed" fill={CHART_COLORS.failed} radius={[0, 4, 4, 0]} />
                            <Bar dataKey="absent" name="Absent" fill={CHART_COLORS.absent} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overall Pass/Fail Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-brand-600" />
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
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {overallPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
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
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-brand-600" />
                      Subject-wise Detailed Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Subject</TableHead>
                            <TableHead className="font-semibold text-center">Appeared</TableHead>
                            <TableHead className="font-semibold text-center">Absent</TableHead>
                            <TableHead className="font-semibold text-center">
                              <span className="text-green-600">Passed</span>
                            </TableHead>
                            <TableHead className="font-semibold text-center">
                              <span className="text-red-600">Failed</span>
                            </TableHead>
                            <TableHead className="font-semibold text-center">Pass %</TableHead>
                            <TableHead className="font-semibold text-center">Avg Marks</TableHead>
                            <TableHead className="font-semibold text-center">Highest</TableHead>
                            <TableHead className="font-semibold text-center">Lowest</TableHead>
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
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                  {subject.passed}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                                  {subject.failed}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-semibold ${subject.pass_percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                  {subject.pass_percentage}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center font-medium">{subject.average_marks}</TableCell>
                              <TableCell className="text-center text-green-600 font-medium">{subject.highest_marks}</TableCell>
                              <TableCell className="text-center text-red-600 font-medium">{subject.lowest_marks}</TableCell>
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
    </div>
  );
}
