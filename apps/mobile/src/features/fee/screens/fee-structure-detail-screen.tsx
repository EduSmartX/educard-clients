import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  FileText,
  Calendar,
  Users,
  IndianRupee,
  Layers,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import { ErrorState, LoadingState } from '@/components/common/ListStates';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';

import { useFeeStructure } from '../hooks';

export default function FeeStructureDetailScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'FeeStructureDetail'>>();
  const { id } = route.params;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const {
    data: structure,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useFeeStructure(id ?? '');

  if (isLoading)
    return <LoadingState color="#059669" message="Loading fee structure..." />;
  if (isError || !structure)
    return (
      <ErrorState
        message="Failed to load fee structure"
        onRetry={() => void refetch()}
      />
    );

  const statusBg = structure.is_active ? '#dcfce7' : '#fee2e2';
  const statusColor = structure.is_active ? '#059669' : '#dc2626';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {structure.name}
            </Text>
            <Text style={styles.headerSub}>{structure.academic_year}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {structure.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#059669"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <IndianRupee size={14} color="#059669" />
              <Text style={styles.rowLabel}>Total Amount</Text>
            </View>
            <Text style={styles.amountValue}>
              ₹{Number(structure.total_amount).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Calendar size={14} color="#64748b" />
              <Text style={styles.rowLabel}>Due Date</Text>
            </View>
            <Text style={styles.rowValue}>{structure.due_date}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Users size={14} color="#64748b" />
              <Text style={styles.rowLabel}>Students</Text>
            </View>
            <Text style={styles.rowValue}>{structure.student_count}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Layers size={14} color="#64748b" />
              <Text style={styles.rowLabel}>Components</Text>
            </View>
            <Text style={styles.rowValue}>{structure.component_count}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Applicable Classes</Text>
          <View style={styles.chipWrap}>
            {(structure.class_names?.length
              ? structure.class_names
              : ['All Classes']
            ).map((name, idx) => (
              <View key={`${name}-${idx}`} style={styles.chip}>
                <Text style={styles.chipText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fee Components</Text>
          {structure.components?.length ? (
            structure.components.map(component => (
              <View key={component.public_id} style={styles.componentRow}>
                <View style={styles.flex1}>
                  <Text style={styles.componentName}>{component.name}</Text>
                  <Text style={styles.componentMeta}>
                    {component.component_type}
                  </Text>
                </View>
                <Text style={styles.componentAmount}>
                  ₹{Number(component.amount).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No components configured</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnBlue]}
            onPress={() =>
              navigation.navigate('FeeStructureForm', {
                id: structure.public_id,
              })
            }
          >
            <FileText size={14} color="#2563eb" />
            <Text style={[styles.actionText, styles.actionTextBlue]}>
              Edit Structure
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGreen]}
            onPress={() =>
              navigation.navigate('FeeStudentFees', {
                fee_structure_public_id: structure.public_id,
              })
            }
          >
            <Users size={14} color="#059669" />
            <Text style={[styles.actionText, styles.actionTextGreen]}>
              View Fees
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  scroll: { padding: 14, gap: 12, paddingBottom: 28 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 13, color: '#64748b' },
  rowValue: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  amountValue: { fontSize: 16, color: '#059669', fontWeight: '800' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#ecfeff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  chipText: { fontSize: 12, color: '#0f766e', fontWeight: '600' },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  componentName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  componentMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  componentAmount: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  emptyText: { fontSize: 13, color: '#94a3b8' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  headerTextWrap: { flex: 1, marginLeft: 10 },
  flex1: { flex: 1 },
  actionBtnBlue: { backgroundColor: '#eff6ff' },
  actionTextBlue: { color: '#2563eb' },
  actionBtnGreen: { backgroundColor: '#f0fdf4' },
  actionTextGreen: { color: '#059669' },
});
