import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  GraduationCap,
  CalendarDays,
  Filter,
} from 'lucide-react-native';
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
import { computeAttendanceInsights } from '@/features/attendance/utils/attendance-insights';

import { ReportInsights } from './ReportInsights';
import { styles } from './styles';

export function ReportTab() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [allStudents, setAllStudents] = useState<
    AttendanceReportData['student_wise']
  >([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fromDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const toDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data: classes, isLoading: loadingClasses } = useEligibleClasses();

  const classOptions = useMemo(() => {
    if (!classes) return [];
    return [
      {
        public_id: 'all',
        display_name: '📊 All Classes (Organization)',
        name: 'All Classes',
      },
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
        50,
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
        50,
      );

      if (moreData.student_wise) {
        setAllStudents(prev => [
          ...(prev || []),
          ...(moreData.student_wise ?? []),
        ]);
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
    const cls = classes.find(c => c.public_id === selectedClassId);
    return cls?.display_name || cls?.name || 'Choose a class...';
  }, [selectedClassId, classes]);

  const activeReportData = reportData;
  const isLoadingData = loadingReport;

  const displayStudents =
    allStudents && allStudents.length > 0
      ? allStudents
      : reportData?.student_wise || [];

  const pagination = reportData?.pagination;
  const hasMorePages = pagination?.has_next || false;
  const totalStudentsCount =
    pagination?.total_count || displayStudents?.length || 0;
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

  const nextMonthDisabled = addMonths(currentMonth, 1) > new Date();

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
      <View style={[styles.selectorCard, styles.zIndex100]}>
        <View style={styles.selectorHeader}>
          <Filter size={18} color="#0d9488" />
          <Text style={styles.selectorTitle}>Select Class</Text>
        </View>
        {loadingClasses && <ActivityIndicator size="small" color="#0d9488" />}
        {!loadingClasses && (!classOptions || classOptions.length === 0) && (
          <Text style={styles.noClassesText}>No classes available</Text>
        )}
        {!loadingClasses && classOptions && classOptions.length > 0 && (
          <View style={styles.zIndex100}>
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
                style={showClassPicker ? styles.chevronUp : styles.chevronDown}
              />
            </TouchableOpacity>

            {showClassPicker && (
              <View style={[styles.dropdownList, styles.zIndex1000]}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {classOptions.map(cls => (
                    <TouchableOpacity
                      key={cls.public_id}
                      style={[
                        styles.dropdownItem,
                        selectedClassId === cls.public_id &&
                          styles.dropdownItemSelected,
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
                          selectedClassId === cls.public_id &&
                            styles.dropdownItemTextSelected,
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
      <View style={[styles.monthNav, styles.zIndex1]}>
        <TouchableOpacity
          onPress={handlePreviousMonth}
          style={styles.monthNavButton}
        >
          <ChevronLeft size={20} color="#0d9488" />
        </TouchableOpacity>
        <View style={styles.monthNavCenter}>
          <CalendarDays size={18} color="#0d9488" />
          <Text style={styles.monthNavText}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.monthNavButton}
          disabled={nextMonthDisabled}
        >
          <ChevronRight
            size={20}
            color={nextMonthDisabled ? '#d1d5db' : '#0d9488'}
          />
        </TouchableOpacity>
      </View>

      {/* Report Content */}
      {!selectedClassId && (
        <View style={styles.emptyState}>
          <GraduationCap size={48} color="#d1d5db" />
          <Text style={styles.emptyStateText}>
            Select a class to view report
          </Text>
        </View>
      )}
      {!!selectedClassId && isLoadingData && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Analyzing attendance data...</Text>
        </View>
      )}
      {!!selectedClassId && !isLoadingData && activeReportData && insights && (
        <ReportInsights
          insights={insights}
          displayStudents={displayStudents}
          loadedStudentsCount={loadedStudentsCount}
          totalStudentsCount={totalStudentsCount}
          hasMorePages={hasMorePages}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => {
            void handleLoadMore();
          }}
        />
      )}
    </ScrollView>
  );
}
