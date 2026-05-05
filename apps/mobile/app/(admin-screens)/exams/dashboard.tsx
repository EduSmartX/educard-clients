/**
 * Exam Dashboard
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, Plus } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useClasses } from '@/features/classes';
import { useExams, useMarksOverview } from '@/features/exams';
import { EXAM_STATUS_LABELS, EXAM_STATUS_COLORS, type Exam } from '@/features/exams/types';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

export default function ExamDashboardScreen() {
  const router = useRouter();
  const { sessionId, sessionName } = useLocalSearchParams<{
    sessionId: string;
    sessionName: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'exams' | 'students'>('exams');
  const [showClassPicker, setShowClassPicker] = useState(false);

  // Fetch classes
  const { data: classesData } = useClasses({ page_size: 100 });
  const classes = classesData?.classes ?? [];
  const selectedClass = classes.find((c: { public_id: string }) => c.public_id === selectedClassId);

  // Get full class name (e.g., "Class 10 - A")
  const getFullClassName = (
    cls: { class_master?: { name: string } | null; name: string } | undefined
  ) => {
    if (!cls) return '';
    return cls.class_master?.name ? `${cls.class_master.name} - ${cls.name}` : cls.name;
  };
  const fullClassName = getFullClassName(selectedClass);

  // Fetch exams for selected class
  const {
    data: examsData,
    isLoading: examsLoading,
    refetch: refetchExams,
  } = useExams({
    session: sessionId,
    class_id: selectedClassId,
    page_size: 100,
  });
  const exams: Exam[] = examsData?.data || [];
  const allExamsCompleted = exams.length > 0 && exams.every((e) => e.status === 'completed');

  // Fetch student marks overview
  const {
    data: marksData,
    isLoading: marksLoading,
    refetch: refetchMarks,
  } = useMarksOverview(sessionId, selectedClassId);
  const students = marksData?.students || [];

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'exams') await refetchExams();
    else await refetchMarks();
    setRefreshing(false);
  };

  const isLoading = activeTab === 'exams' ? examsLoading : marksLoading;

  const renderExam = ({ item, index }: { item: Exam; index: number }) => {
    const statusColor = EXAM_STATUS_COLORS[item.status] || EXAM_STATUS_COLORS.draft;
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40)
          .springify()
          .damping(18)}
      >
        <View style={styles.examCard}>
          <View style={styles.examHeader}>
            <Text style={styles.examSubject}>{item.subject_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {EXAM_STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>
          <Text style={styles.examDetails}>
            Max: {item.max_marks} • Pass: {item.passing_marks} • Marks: {item.marks_count}
          </Text>
          <TouchableOpacity
            style={styles.enterMarksBtn}
            onPress={() =>
              router.push(
                `/(admin-screens)/exams/enter-marks?examId=${item.public_id}&sessionId=${sessionId}&classId=${selectedClassId}&subjectName=${encodeURIComponent(item.subject_name)}&className=${encodeURIComponent(fullClassName)}&maxMarks=${item.max_marks}` as any
              )
            }
          >
            <Text style={styles.enterMarksText}>Enter Marks</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderStudent = ({ item, index }: { item: any; index: number }) => {
    const passed = item.summary?.is_pass;
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 40)
          .springify()
          .damping(18)}
      >
        <TouchableOpacity
          style={styles.studentCard}
          onPress={() =>
            router.push(
              `/(admin-screens)/exams/student-detail?studentId=${item.student_public_id}&sessionId=${sessionId}&classId=${selectedClassId}&studentName=${encodeURIComponent(item.student_name)}` as any
            )
          }
        >
          <View style={styles.studentHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{item.student_name}</Text>
              <Text style={styles.studentAdm}>{item.admission_number}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: passed ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={[styles.statusText, { color: passed ? '#16a34a' : '#dc2626' }]}>
                {passed ? 'PASS' : 'FAIL'}
              </Text>
            </View>
          </View>
          {item.summary && (
            <View style={styles.studentStats}>
              <Text style={styles.statItem}>
                Total: {item.summary.total_obtained}/{item.summary.total_max}
              </Text>
              <Text style={styles.statItem}>Avg: {item.summary.percentage.toFixed(1)}%</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Exam Dashboard</Text>
              <Text style={headerStyles.subtitle}>{decodeURIComponent(sessionName || '')}</Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() =>
                router.push(`/(admin-screens)/exams/create-exam?sessionId=${sessionId}` as any)
              }
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Class Picker */}
          <TouchableOpacity
            style={styles.classPicker}
            onPress={() => setShowClassPicker(!showClassPicker)}
          >
            <Text style={styles.classPickerText}>
              {selectedClass
                ? selectedClass.display_name ||
                  `${selectedClass.class_master?.name || ''} - ${selectedClass.name}`.trim()
                : 'Select Class'}
            </Text>
            <ChevronDown size={20} color="#fff" />
          </TouchableOpacity>

          {showClassPicker && (
            <ScrollView style={styles.classDropdown}>
              {classes.map((cls: any) => (
                <TouchableOpacity
                  key={cls.public_id}
                  style={styles.classOption}
                  onPress={() => {
                    setSelectedClassId(cls.public_id);
                    setShowClassPicker(false);
                  }}
                >
                  <Text style={styles.classOptionText}>
                    {cls.display_name || `${cls.class_master?.name || ''} - ${cls.name}`.trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </LinearGradient>

      {!selectedClassId ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>Select a Class</Text>
          <Text style={styles.emptySubtitle}>Choose a class from the dropdown above</Text>
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'exams' && styles.tabActive]}
              onPress={() => setActiveTab('exams')}
            >
              <Text style={[styles.tabText, activeTab === 'exams' && styles.tabTextActive]}>
                Exams ({exams.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'students' && styles.tabActive,
                !allExamsCompleted && styles.tabDisabled,
              ]}
              onPress={() => allExamsCompleted && setActiveTab('students')}
              disabled={!allExamsCompleted}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'students' && styles.tabTextActive,
                  !allExamsCompleted && styles.tabTextDisabled,
                ]}
              >
                Students ({students.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading && !refreshing ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7c3aed" />
            </View>
          ) : activeTab === 'exams' ? (
            exams.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>No Exams</Text>
                <Text style={styles.emptySubtitle}>Create exams for this class</Text>
              </View>
            ) : (
              <FlatList
                data={exams}
                renderItem={renderExam}
                keyExtractor={(item) => item.public_id}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#7c3aed']}
                  />
                }
              />
            )
          ) : students.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Students</Text>
              <Text style={styles.emptySubtitle}>No marks data available</Text>
            </View>
          ) : (
            <FlatList
              data={students}
              renderItem={renderStudent}
              keyExtractor={(item) => item.student_public_id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#7c3aed']}
                />
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  classPickerText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  classDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  classOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  classOptionText: { fontSize: 14, color: '#1e293b' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  tabDisabled: { opacity: 0.4 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#7c3aed' },
  tabTextDisabled: { color: '#cbd5e1' },

  list: { padding: 16, paddingBottom: 40 },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  examSubject: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  examDetails: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  enterMarksBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  enterMarksText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  studentAdm: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  studentStats: { flexDirection: 'row', gap: 16 },
  statItem: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 6,
  },
});
