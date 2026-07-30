/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { useEligibleClasses } from '@/features/attendance';
import {
  getAttendanceReport,
  type AttendanceReportData,
} from '@/features/attendance/api/dashboard-api';
import {
  computeAttendanceInsights,
  getHealthColor,
  getHealthLabel,
  getAvatarBgColor,
  getAvatarTextColor,
  getPercentageStyle,
} from '@/features/attendance/utils/attendance-insights';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CalendarDays,
  Calendar,
  Clock,
  Filter,
  AlertTriangle,
  Award,
  Lightbulb,
  UserX,
  ThumbsUp,
} from '@/lib/lucide-shim';

import { styles } from './styles';

export function ReportTab() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [allStudents, setAllStudents] = useState<AttendanceReportData['student_wise']>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fromDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const toDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: classes, isLoading: loadingClasses } = useEligibleClasses();

  const classOptions = useMemo(() => {
    if (!classes) return [];
    return [
      { public_id: 'all', display_name: '📊 All Classes (Organization)', name: 'All Classes' },
      ...classes,
    ];
  }, [classes]);

  const {
    data: reportData,
    isLoading: loadingReport,
    refetch,
  } = useQuery({
    queryKey: ['attendance-report', selectedClassId, fromDate, toDate, 1],
    queryFn: () =>
      getAttendanceReport(
        selectedClassId === 'all' ? null : selectedClassId,
        fromDate,
        toDate,
        1,
        50
      ),
    enabled: !!selectedClassId,
  });

  useMemo(() => {
    if (reportData?.student_wise && currentPage === 1) {
      setAllStudents(reportData.student_wise);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportData]);

  const handleLoadMore = async () => {
    if (!reportData?.pagination?.has_next || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreData = await getAttendanceReport(
        selectedClassId === 'all' ? null : selectedClassId,
        fromDate,
        toDate,
        nextPage,
        50
      );

      if (moreData.student_wise) {
        setAllStudents((prev) => [...(prev || []), ...(moreData.student_wise ?? [])]);
        setCurrentPage(nextPage);
      }
    } catch {
      // Error handled silently
    } finally {
      setIsLoadingMore(false);
    }
  };

  const selectedClassName = useMemo(() => {
    if (!selectedClassId) return 'Choose a class...';
    if (selectedClassId === 'all') return '📊 All Classes (Organization)';
    if (!classes) return 'Choose a class...';
    const cls = classes.find((c) => c.public_id === selectedClassId);
    return cls?.display_name || cls?.name || 'Choose a class...';
  }, [selectedClassId, classes]);

  const activeReportData = reportData;
  const isLoadingData = loadingReport;

  const displayStudents =
    allStudents && allStudents.length > 0 ? allStudents : reportData?.student_wise || [];

  const pagination = reportData?.pagination;
  const hasMorePages = pagination?.has_next || false;
  const totalStudentsCount = pagination?.total_count || displayStudents?.length || 0;
  const loadedStudentsCount = displayStudents?.length || 0;

  const insights = useMemo(() => {
    return computeAttendanceInsights(activeReportData, displayStudents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReportData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setAllStudents([]);
    await refetch();
    setRefreshing(false);
  };

  const handlePreviousMonth = () => {
    setCurrentPage(1);
    setAllStudents([]);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      setCurrentPage(1);
      setAllStudents([]);
      setCurrentMonth(nextMonth);
    }
  };

  const getHealthIcon = (health: string) => {
    const color = getHealthColor(health).icon;
    switch (health) {
      case 'excellent':
        return <Award size={28} color={color} />;
      case 'good':
        return <ThumbsUp size={28} color={color} />;
      case 'concern':
        return <AlertTriangle size={28} color={color} />;
      default:
        return <XCircle size={28} color={color} />;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Class Selector */}
      <View style={[styles.selectorCard, { zIndex: 100 }]}>
        <View style={styles.selectorHeader}>
          <Filter size={18} color="#0d9488" />
          <Text style={styles.selectorTitle}>Select Class</Text>
        </View>
        {loadingClasses && <ActivityIndicator size="small" color="#0d9488" />}
        {!loadingClasses && (!classOptions || classOptions.length === 0) && (
          <Text style={{ color: '#9ca3af', fontSize: 14, paddingVertical: 8 }}>
            No classes available
          </Text>
        )}
        {!loadingClasses && classOptions && classOptions.length > 0 && (
          <View style={{ zIndex: 100 }}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowClassPicker(!showClassPicker)}
              activeOpacity={0.7}
            >
              <Users size={18} color="#64748b" />
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedClassName}
              </Text>
              <ChevronDown
                size={18}
                color="#64748b"
                style={{ transform: [{ rotate: showClassPicker ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showClassPicker && (
              <View style={[styles.dropdownList, { zIndex: 1000 }]}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {classOptions.map((cls) => (
                    <TouchableOpacity
                      key={cls.public_id}
                      style={[
                        styles.dropdownItem,
                        selectedClassId === cls.public_id && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setCurrentPage(1);
                        setAllStudents([]);
                        setSelectedClassId(cls.public_id);
                        setShowClassPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedClassId === cls.public_id && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {cls.display_name || cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Month Navigator */}
      <View style={[styles.monthNav, { zIndex: 1 }]}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthNavButton}>
          <ChevronLeft size={20} color="#0d9488" />
        </TouchableOpacity>
        <View style={styles.monthNavCenter}>
          <CalendarDays size={18} color="#0d9488" />
          <Text style={styles.monthNavText}>{format(currentMonth, 'MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.monthNavButton}
          disabled={addMonths(currentMonth, 1) > new Date()}
        >
          <ChevronRight
            size={20}
            color={addMonths(currentMonth, 1) > new Date() ? '#d1d5db' : '#0d9488'}
          />
        </TouchableOpacity>
      </View>

      {/* Report Content */}
      {!selectedClassId && (
        <View style={styles.emptyState}>
          <GraduationCap size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>Select a class to view report</Text>
        </View>
      )}
      {!!selectedClassId && isLoadingData && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Analyzing attendance data...</Text>
        </View>
      )}
      {!!selectedClassId && !isLoadingData && activeReportData && insights && (
        <>
          {/* Class Health Overview */}
          <View
            style={[
              styles.healthCard,
              { backgroundColor: getHealthColor(insights.classHealth).bg },
            ]}
          >
            <View style={styles.healthHeader}>
              <View style={styles.healthLeft}>
                {getHealthIcon(insights.classHealth)}
                <View>
                  <Text
                    style={[
                      styles.healthTitle,
                      { color: getHealthColor(insights.classHealth).text },
                    ]}
                  >
                    {getHealthLabel(insights.classHealth)}
                  </Text>
                  <Text style={styles.healthSubtitle}>
                    {insights.totalStudents} student{insights.totalStudents !== 1 ? 's' : ''} •{' '}
                    {insights.totalWorkingDays} working day
                    {insights.totalWorkingDays !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.healthPercentage}>
                <Text
                  style={[
                    styles.healthPercentageValue,
                    { color: getHealthColor(insights.classHealth).text },
                  ]}
                >
                  {insights.overallPercentage}%
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Insights Grid */}
          <View style={styles.insightsGrid}>
            <View style={[styles.insightBox, { backgroundColor: '#dcfce7' }]}>
              <View style={styles.insightHeader}>
                <CheckCircle2 size={16} color="#16a34a" />
                <Text style={[styles.insightValue, { color: '#16a34a' }]}>
                  {insights.excellentStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>≥95% Attendance</Text>
            </View>
            <View style={[styles.insightBox, { backgroundColor: '#dbeafe' }]}>
              <View style={styles.insightHeader}>
                <TrendingUp size={16} color="#2563eb" />
                <Text style={[styles.insightValue, { color: '#2563eb' }]}>
                  {insights.goodStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>85-94% Attendance</Text>
            </View>
            <View style={[styles.insightBox, { backgroundColor: '#fef3c7' }]}>
              <View style={styles.insightHeader}>
                <AlertTriangle size={16} color="#d97706" />
                <Text style={[styles.insightValue, { color: '#d97706' }]}>
                  {insights.atRiskStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>75-84% At Risk</Text>
            </View>
            <View style={[styles.insightBox, { backgroundColor: '#fee2e2' }]}>
              <View style={styles.insightHeader}>
                <XCircle size={16} color="#dc2626" />
                <Text style={[styles.insightValue, { color: '#dc2626' }]}>
                  {insights.criticalStudents.length}
                </Text>
              </View>
              <Text style={styles.insightLabel}>&lt;75% Critical</Text>
            </View>
          </View>

          {/* Actionable Insights */}
          <View style={styles.actionSection}>
            <View style={styles.actionHeader}>
              <Lightbulb size={18} color="#f59e0b" />
              <Text style={styles.actionTitle}>Action Items</Text>
            </View>

            {insights.perfectAttendance.length > 0 && (
              <View style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                  <Award size={20} color="#16a34a" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>🎉 Recognize Perfect Attendance</Text>
                  <Text style={styles.actionCardDesc}>
                    {insights.perfectAttendance.length} student
                    {insights.perfectAttendance.length > 1 ? 's have' : ' has'} 100% attendance this
                    month
                  </Text>
                  <View style={styles.actionNames}>
                    {insights.perfectAttendance.slice(0, 3).map((s) => (
                      <View key={s.student_id} style={styles.nameBadge}>
                        <Text style={styles.nameBadgeText}>{s.student_name.split(' ')[0]}</Text>
                      </View>
                    ))}
                    {insights.perfectAttendance.length > 3 && (
                      <Text style={styles.moreText}>
                        +{insights.perfectAttendance.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {insights.criticalStudents.length > 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#ef4444' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                  <UserX size={20} color="#dc2626" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionCardTitle, { color: '#dc2626' }]}>
                    ⚠️ Contact Parents Immediately
                  </Text>
                  <Text style={styles.actionCardDesc}>
                    {insights.criticalStudents.length} student
                    {insights.criticalStudents.length > 1 ? 's are' : ' is'} below 75% -
                    intervention needed
                  </Text>
                  <View style={styles.criticalList}>
                    {insights.criticalStudents.slice(0, 3).map((s) => (
                      <View key={s.student_id} style={styles.criticalItem}>
                        <Text style={styles.criticalName}>{s.student_name}</Text>
                        <View style={[styles.criticalBadge, { backgroundColor: '#fee2e2' }]}>
                          <Text style={styles.criticalPercent}>{s.percentage}%</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {insights.highAbsentees.length > 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#f59e0b' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                  <Calendar size={20} color="#d97706" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>📋 Review High Absentees</Text>
                  <Text style={styles.actionCardDesc}>
                    Students with 3+ absences this month need follow-up
                  </Text>
                  <View style={styles.absenteeList}>
                    {insights.highAbsentees.map((s) => (
                      <View key={s.student_id} style={styles.absenteeItem}>
                        <Text style={styles.absenteeName} numberOfLines={1}>
                          {s.student_name}
                        </Text>
                        <View style={styles.absenteeStats}>
                          <XCircle size={12} color="#dc2626" />
                          <Text style={styles.absenteeCount}>{s.absent} days</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {insights.frequentHalfDays.length > 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#0d9488' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#ccfbf1' }]}>
                  <Clock size={20} color="#0d9488" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>⏰ Check Late/Early Leaving Patterns</Text>
                  <Text style={styles.actionCardDesc}>
                    {insights.frequentHalfDays.length} student
                    {insights.frequentHalfDays.length > 1 ? 's have' : ' has'} multiple half-days
                  </Text>
                  <View style={styles.halfDayList}>
                    {insights.frequentHalfDays.map((s) => (
                      <View key={s.student_id} style={styles.halfDayItem}>
                        <Text style={styles.halfDayName} numberOfLines={1}>
                          {s.student_name}
                        </Text>
                        <View style={styles.halfDayBadge}>
                          <Clock size={10} color="#d97706" />
                          <Text style={styles.halfDayCount}>{s.half_day}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {insights.criticalStudents.length === 0 && insights.highAbsentees.length === 0 && (
              <View style={[styles.actionCard, { borderLeftColor: '#22c55e' }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                  <ThumbsUp size={20} color="#16a34a" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionCardTitle}>✅ Great Job!</Text>
                  <Text style={styles.actionCardDesc}>
                    No critical attendance issues found. Keep up the good work!
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Class Averages Summary */}
          <View style={styles.averagesCard}>
            <Text style={styles.averagesTitle}>Class Averages</Text>
            <View style={styles.averagesRow}>
              <View style={styles.averageItem}>
                <Text style={styles.averageValue}>{insights.avgAbsent}</Text>
                <Text style={styles.averageLabel}>Avg. Absences</Text>
              </View>
              <View style={styles.averageDivider} />
              <View style={styles.averageItem}>
                <Text style={styles.averageValue}>{insights.avgHalfDay}</Text>
                <Text style={styles.averageLabel}>Avg. Half Days</Text>
              </View>
              <View style={styles.averageDivider} />
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: '#0d9488' }]}>
                  {insights.overallPercentage}%
                </Text>
                <Text style={styles.averageLabel}>Attendance Rate</Text>
              </View>
            </View>
          </View>

          {/* Student-wise Breakdown */}
          {displayStudents && displayStudents.length > 0 && (
            <View style={styles.studentListCard}>
              <View style={styles.studentListHeader}>
                <View>
                  <Text style={styles.studentListTitle}>Student Performance</Text>
                  <Text style={styles.studentListSubtitle}>Sorted by attendance %</Text>
                </View>
                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    {loadedStudentsCount} of {totalStudentsCount}
                  </Text>
                </View>
              </View>
              {[...displayStudents]
                .sort((a, b) => a.percentage - b.percentage)
                .map((student, index) => (
                  <View
                    key={student.student_id}
                    style={[
                      styles.studentRow,
                      index !== displayStudents.length - 1 && styles.studentRowBorder,
                    ]}
                  >
                    <View style={styles.studentInfo}>
                      <View
                        style={[
                          styles.studentAvatar,
                          { backgroundColor: getAvatarBgColor(student.percentage) },
                        ]}
                      >
                        <Text
                          style={[
                            styles.studentAvatarText,
                            { color: getAvatarTextColor(student.percentage) },
                          ]}
                        >
                          {student.student_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {student.student_name}
                        </Text>
                        <View style={styles.studentMiniStats}>
                          <Text style={styles.miniStatText}>P:{student.present}</Text>
                          <Text style={styles.miniStatText}>A:{student.absent}</Text>
                          <Text style={styles.miniStatText}>H:{student.half_day}</Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.studentPercentageLarge,
                        getPercentageStyle(student.percentage, styles),
                      ]}
                    >
                      <Text style={styles.studentPercentageTextLarge}>{student.percentage}%</Text>
                    </View>
                  </View>
                ))}

              {hasMorePages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => {
                    void handleLoadMore();
                  }}
                  disabled={isLoadingMore}
                  activeOpacity={0.7}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#0d9488" />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>
                        Load More ({totalStudentsCount - loadedStudentsCount} remaining)
                      </Text>
                      <ChevronDown size={18} color="#0d9488" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
