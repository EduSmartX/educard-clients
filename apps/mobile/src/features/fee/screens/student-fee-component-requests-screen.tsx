/**
 * Student Fee Component Requests Screen
 * Admin queue for approving/rejecting parent opt-in/opt-out requests
 * for optional fee components.
 */

import { ComponentApprovalStatus } from '@educard/shared';
import type { StudentFeeComponentItem } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SearchBar } from '@/components/common/SearchBar';
import { ClassFilterDropdown } from '@/components/filters';
import { colors } from '@/constants/colors';
import {
  useStudentFees,
  useStudentFee,
  useReviewComponentRequests,
} from '@/features/fee';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';

export default function StudentFeeComponentRequestsScreen() {
  const qc = useQueryClient();
  const navigation = useNavigation<SharedStackNavigation>();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const { data: queueData, isLoading: isQueueLoading } = useStudentFees({
    class_public_id: classFilter || undefined,
    has_pending_component_requests: true,
    page_size: 100,
  });

  const queueItems = useMemo(() => queueData?.items ?? [], [queueData?.items]);

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queueItems;
    return queueItems.filter(
      fee =>
        fee.student_name.toLowerCase().includes(q) ||
        fee.class_name.toLowerCase().includes(q) ||
        fee.fee_structure_name.toLowerCase().includes(q),
    );
  }, [queueItems, search]);

  useEffect(() => {
    if (!filteredQueue.length) {
      setSelectedId(undefined);
      return;
    }
    const stillExists = filteredQueue.some(
      item => item.public_id === selectedId,
    );
    if (!selectedId || !stillExists) {
      setSelectedId(filteredQueue[0].public_id);
    }
  }, [filteredQueue, selectedId]);

  const { data: selectedFee, isLoading: isDetailLoading } = useStudentFee(
    selectedId ?? '',
  );
  const reviewRequests = useReviewComponentRequests();

  const pendingComponents = (selectedFee?.components ?? []).filter(
    (c: StudentFeeComponentItem) =>
      c.approval_status === ComponentApprovalStatus.PENDING,
  );

  const invalidateQueue = () => {
    void qc.invalidateQueries({ queryKey: ['fee', 'student-fees'] });
  };

  const handleApprove = (componentPublicId: string) => {
    if (!selectedId) return;
    reviewRequests.mutate(
      {
        id: selectedId,
        data: {
          decisions: [
            { component_public_id: componentPublicId, action: 'approve' },
          ],
        },
      },
      { onSuccess: invalidateQueue },
    );
  };

  const handleReject = (componentPublicId: string) => {
    if (!selectedId) return;
    reviewRequests.mutate(
      {
        id: selectedId,
        data: {
          decisions: [
            {
              component_public_id: componentPublicId,
              action: 'reject',
              admin_note: rejectNotes[componentPublicId] ?? '',
            },
          ],
        },
      },
      { onSuccess: invalidateQueue },
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7c3aed', '#a78bfa']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Component Requests</Text>
            <Text style={styles.headerSub}>
              Approve or reject opt-in/out requests
            </Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ClassFilterDropdown value={classFilter} onChange={setClassFilter} />
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search students"
          />
        </View>

        {/* Queue */}
        <Text style={styles.sectionLabel}>Pending queue</Text>
        {isQueueLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : filteredQueue.length === 0 ? (
          <View style={styles.emptyBox}>
            <ClipboardCheck size={28} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No pending component requests.</Text>
          </View>
        ) : (
          filteredQueue.map(fee => {
            const isSelected = fee.public_id === selectedId;
            return (
              <TouchableOpacity
                key={fee.public_id}
                style={[styles.queueItem, isSelected && styles.queueItemActive]}
                onPress={() => setSelectedId(fee.public_id)}
              >
                <View style={styles.queueLeft}>
                  <Text style={styles.queueName}>{fee.student_name}</Text>
                  <Text style={styles.queueMeta}>{fee.class_name}</Text>
                  <Text style={styles.queueSub}>{fee.fee_structure_name}</Text>
                </View>
                <View style={styles.queueRight}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>
                      {fee.pending_approvals ?? 0} pending
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.gray[400]} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Selected student's pending components */}
        {selectedId && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionLabel}>
              {selectedFee
                ? `Requests: ${selectedFee.student_name}`
                : 'Requests'}
            </Text>

            {isDetailLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color={colors.primary[600]} />
              </View>
            ) : pendingComponents.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  No pending requests for this student.
                </Text>
              </View>
            ) : (
              pendingComponents.map((component: StudentFeeComponentItem) => {
                const wantsToAdd = component.is_selected;
                return (
                  <View key={component.public_id} style={styles.componentCard}>
                    <View style={styles.componentTop}>
                      <Text style={styles.componentName}>{component.name}</Text>
                      <Text style={styles.componentAmount}>
                        {'\u20b9'}
                        {Number(component.amount)}
                      </Text>
                    </View>
                    <View style={wantsToAdd ? styles.tagAdd : styles.tagRemove}>
                      <Text
                        style={
                          wantsToAdd ? styles.tagAddText : styles.tagRemoveText
                        }
                      >
                        {wantsToAdd ? 'Opt-in requested' : 'Opt-out requested'}
                      </Text>
                    </View>
                    {!!component.request_note && (
                      <Text style={styles.requestNote}>
                        {component.request_note}
                      </Text>
                    )}

                    <TextInput
                      style={styles.noteInput}
                      placeholder="Reason if rejecting this request"
                      placeholderTextColor={colors.gray[400]}
                      value={rejectNotes[component.public_id] ?? ''}
                      onChangeText={t =>
                        setRejectNotes(prev => ({
                          ...prev,
                          [component.public_id]: t,
                        }))
                      }
                    />

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        disabled={reviewRequests.isPending}
                        onPress={() => handleApprove(component.public_id)}
                      >
                        <CheckCircle2 size={16} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        disabled={reviewRequests.isPending}
                        onPress={() => handleReject(component.public_id)}
                      >
                        <XCircle size={16} color="#ffffff" />
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  searchWrap: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 20,
    marginBottom: 10,
  },
  centerBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[100],
    backgroundColor: colors.gray[50],
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  queueItemActive: {
    borderColor: colors.warning[400],
    backgroundColor: colors.warning[50],
  },
  queueLeft: {
    flex: 1,
  },
  queueName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  queueMeta: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  queueSub: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 1,
  },
  queueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingBadge: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning[800],
  },
  detailSection: {
    marginTop: 8,
  },
  componentCard: {
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  componentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  componentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  componentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[800],
    marginLeft: 10,
  },
  tagAdd: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success[50],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  tagAddText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success[700],
  },
  tagRemove: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger[50],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  tagRemoveText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger[700],
  },
  requestNote: {
    fontSize: 12,
    color: colors.gray[500],
    fontStyle: 'italic',
    marginTop: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.gray[900],
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  approveBtn: {
    backgroundColor: colors.success[600],
  },
  rejectBtn: {
    backgroundColor: colors.danger[600],
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
