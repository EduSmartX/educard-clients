/**
 * ID Card Approvals - the designed ID cards EduCard sent for the school to approve.
 * The school admin sees every class; a class teacher sees the classes they teach.
 */

import type { IdCardProofSummary, ProofStatus } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, ClipboardCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { SegmentedSelector } from '@/components/ui';
import { formatDate, useProofs } from '@/features/store';
import { ProofStatusPill } from '@/features/store/components/ProofStatusPill';
import { StoreHeader } from '@/features/store/components/StoreHeader';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';

type Filter = 'waiting' | 'all';

const FILTERS = [
  { value: 'waiting' as const, label: 'Waiting for me' },
  { value: 'all' as const, label: 'All' },
];

export default function StoreProofsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('waiting');
  const status: ProofStatus | undefined =
    filter === 'waiting' ? 'sent' : undefined;
  const { data, isLoading, isRefetching, refetch } = useProofs(status);
  const proofs = (data?.data ?? []).filter(
    proof => proof.status !== 'superseded',
  );

  const renderProof = ({ item }: { item: IdCardProofSummary }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('StoreProofReview', { proofId: item.public_id })
      }
      accessibilityRole="button"
      accessibilityLabel={`${item.class_name}, ${item.status_label}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.title}>
            {item.class_name || item.product_name}
          </Text>
          <Text style={styles.product} numberOfLines={1}>
            {item.product_name}
          </Text>
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </View>
      <View style={styles.metaRow}>
        <ProofStatusPill
          status={item.status}
          label={item.status_label}
          size="sm"
          cancelled={item.order_status === 'cancelled'}
        />
        {item.my_decision === 'approved' ? (
          <Text style={styles.mine}>You approved</Text>
        ) : item.my_decision === 'changes_requested' ? (
          <Text style={styles.mineChanges}>You asked for changes</Text>
        ) : null}
      </View>
      <Text style={styles.meta}>
        {item.student_count} student{item.student_count === 1 ? '' : 's'} ·
        version {item.version} · sent {formatDate(item.sent_at)}
      </Text>
      <Text style={styles.meta}>Order {item.order_number}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <StoreHeader
        title="ID Card Approvals"
        subtitle="Check and approve your classes' cards"
      />
      <View style={styles.filters}>
        <SegmentedSelector
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </View>
      {isLoading ? (
        <LoadingState color="#7c3aed" />
      ) : proofs.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={40} color="#9ca3af" />}
          message={
            filter === 'waiting'
              ? 'Nothing waiting for approval'
              : 'No ID card proofs yet'
          }
          subMessage="When EduCard sends designed ID cards for your classes, they appear here."
        />
      ) : (
        <FlatList
          data={proofs}
          keyExtractor={item => item.public_id}
          renderItem={renderProof}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  product: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mine: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  mineChanges: { fontSize: 13, fontWeight: '600', color: '#dc2626' },
  meta: { fontSize: 13, color: '#4b5563' },
});
