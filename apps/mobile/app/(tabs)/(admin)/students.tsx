/**
 * Students List Screen
 * Mobile-first student management with search, class filtering, and real API integration
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { GraduationCap, Upload, Plus } from 'lucide-react-native';
import { Colors, getRoleGradient, getRoleThemeColors, Student, useDebounce } from '@educard/shared';
import { useStudents, useDeleteStudent } from '@/features/students';
import { useClasses } from '@/features/classes';
import { SearchBar, ListHeader } from '@/components/common';
import { LoadingState, ErrorState, EmptyState, ListFooter } from '@/components/common/ListStates';
import { EntityActions } from '@/components/common/EntityActions';
import {
  FilterModal,
  ActiveFilters,
  useStudentFilterFields,
  getStudentFilterLabels,
} from '@/components/filters';
import { 
  layoutStyles, 
  cardStyles,
  avatarStyles,
  listStyles,
  textStyles,
} from '@/styles';
import { useListScroll } from '@/hooks/useListScroll';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';

const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

export default function StudentsScreen() {
  const router = useRouter();
  const { class_id, class_name } = useLocalSearchParams<{ class_id?: string; class_name?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Dynamic filter fields (includes class dropdown)
  const studentFilterFields = useStudentFilterFields();

  // Classes for label resolution
  const { data: classesData } = useClasses({ page_size: 100 });
  const classOptions = useMemo(() => {
    return (classesData?.classes || []).map((c: any) => ({
      value: c.public_id,
      label: `${c.class_master?.name || ''} - ${c.name}`.trim(),
    }));
  }, [classesData]);
  
  const { 
    data, isLoading, isError, error, refetch, isRefetching,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useStudents({ 
    search: debouncedSearch || undefined,
    class_id: filters.class_id || class_id || undefined,
    ...filters,
  });
  
  const deleteMutation = useDeleteStudent();
  const confirmDelete = useDeleteConfirm({ entityName: 'Student', deleteMutation });
  
  const students = data?.students ?? [];
  const totalCount = data?.totalCount ?? 0;
  const screenTitle = class_name ? `Students - ${class_name}` : 'Students';

  const { handleScroll, loadMore, onRefresh } = useListScroll({
    hasNextPage, isFetchingNextPage, isRefetching, fetchNextPage, refetch,
  });

  const handleView = useCallback((s: Student) => {
    router.push({ pathname: '/(admin-screens)/students/[id]' as any, params: { id: s.public_id } });
  }, [router]);

  const handleEdit = useCallback((s: Student) => {
    router.push({ pathname: '/(admin-screens)/students/edit' as any, params: { id: s.public_id } });
  }, [router]);

  const renderStudentCard = useCallback(({ item, index }: { item: any; index: number }) => {
    // Resolve fields — backend may nest under user_info
    const fullName = item.full_name || item.user_info?.full_name
      || `${item.user_info?.first_name || item.first_name || ''} ${item.user_info?.last_name || item.last_name || ''}`.trim();
    const rollNumber = item.roll_number;
    const admissionNumber = item.admission_number;
    const classInfo = item.class_info;
    const className = classInfo
      ? (classInfo.class_master_name
          ? `${classInfo.class_master_name} - ${classInfo.name}`
          : classInfo.class_master?.name
            ? `${classInfo.class_master.name} - ${classInfo.name}`
            : classInfo.name)
      : null;

    const initials = fullName
      ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      : '?';

    return (
      <Animated.View entering={FadeInRight.delay(Math.min(index, 10) * 50).duration(300)}>
        <TouchableOpacity 
          style={[cardStyles.card, styles.studentCard]}
          onPress={() => handleView(item)}
          activeOpacity={0.7}
        >
          {/* Top row — Avatar + Info */}
          <View style={styles.topRow}>
            <View style={avatarStyles.container}>
              <View style={[avatarStyles.medium, styles.avatarGrad]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>

            <View style={styles.studentInfo}>
              <Text style={textStyles.title} numberOfLines={1}>
                {fullName || 'Unnamed Student'}
              </Text>
              {rollNumber ? (
                <Text style={textStyles.subtitle}>Roll No: {rollNumber}</Text>
              ) : null}
              <View style={styles.metaRow}>
                {className ? (
                  <View style={styles.classTag}>
                    <Text style={styles.classText}>🏫 {className}</Text>
                  </View>
                ) : null}
                {admissionNumber ? (
                  <Text style={styles.admText}>Adm: {admissionNumber}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Bottom — Actions */}
          <EntityActions
            onView={() => handleView(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => confirmDelete(item.public_id, fullName || 'this student')}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleView, handleEdit, confirmDelete]);

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <ListHeader
        title={screenTitle}
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={() => router.navigate('/(tabs)/(admin)/management' as any)}
        actions={[
          { icon: Upload, onPress: () => Alert.alert('Bulk Upload', 'Coming soon') },
          { icon: Plus, onPress: () => router.push('/(admin-screens)/students/create' as any), variant: 'primary' },
        ]}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, admission no..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.values(filters).filter(Boolean).length}
      />

      {/* Active Filters */}
      <ActiveFilters
        filters={getStudentFilterLabels(filters, classOptions)}
        onRemove={(key) => setFilters(f => ({ ...f, [key]: undefined }))}
        onClearAll={() => setFilters({})}
      />

      {/* Filter Modal — now with class dropdown */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={(f: Record<string, any>) => { setFilters(f); setShowFilters(false); }}
        fields={studentFilterFields}
        title="Filter Students"
      />

      {/* Students List */}
      {isLoading ? (
        <LoadingState color={adminTheme.accent} message="Loading students..." />
      ) : isError ? (
        <ErrorState
          message="Failed to load students"
          detail={error?.message}
          onRetry={() => refetch()}
        />
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudentCard}
          keyExtractor={(item) => item.public_id}
          contentContainerStyle={listStyles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={onRefresh}
              colors={[adminTheme.accent]}
              tintColor={adminTheme.accent}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListFooterComponent={<ListFooter isLoading={isFetchingNextPage} color={adminTheme.accent} />}
          ListEmptyComponent={
            <EmptyState
              icon={<GraduationCap size={48} color={Colors.gray[300]} />}
              message="No students found"
              subMessage={searchQuery ? 'Try adjusting your search' : 'Add your first student'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  studentCard: { flexDirection: 'column' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  studentInfo: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  classTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  classText: { fontSize: 11, color: Colors.primary[600], fontWeight: '500' },
  admText: { fontSize: 11, color: Colors.gray[500], fontWeight: '500' },
  avatarGrad: {
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
});
