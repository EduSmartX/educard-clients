/**
 * ID card approval - look through every student's designed card (front and back), flag
 * the ones that need fixing, then approve or ask for changes.
 *
 * One approval (school admin or class teacher) is enough unless EduCard requires both;
 * a change request from either always stops printing. Answers can be changed until
 * printing starts.
 */

import {
  getErrorMessage,
  type ProofDecisionRow,
  type ProofStudent,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Flag,
  MinusCircle,
  XCircle,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { InfoPoints, InfoPointText } from '@/components/ui';
import { formatDate, useDecideProof, useProofDetail } from '@/features/store';
import { CardSides } from '@/features/store/components/CardSides';
import { ProofStatusPill } from '@/features/store/components/ProofStatusPill';
import { StoreHeader } from '@/features/store/components/StoreHeader';
import type { SharedStackParamList } from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

type ReviewRoute = RouteProp<SharedStackParamList, 'StoreProofReview'>;

function DecisionRow({ row }: { row: ProofDecisionRow }) {
  const decided = row.decision !== '';
  const approved = row.decision === 'approved';
  const Icon = !decided
    ? row.not_needed
      ? MinusCircle
      : Circle
    : approved
      ? CheckCircle2
      : XCircle;
  const colour = !decided ? '#9ca3af' : approved ? '#16a34a' : '#dc2626';
  return (
    <View style={styles.decision}>
      <Icon size={20} color={colour} />
      <View style={styles.flex}>
        <Text style={styles.decisionRole}>
          {row.role_label}
          {row.required_person ? ` (${row.required_person})` : ''}
        </Text>
        <Text style={styles.decisionState}>
          {!decided
            ? row.not_needed
              ? 'Not needed: already approved'
              : 'Waiting'
            : `${approved ? 'Approved' : 'Asked for changes'} by ${
                row.decided_by
              } · ${formatDate(row.decided_at)}`}
        </Text>
        {row.comment ? (
          <Text style={styles.comment}>“{row.comment}”</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function StoreProofReviewScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<ReviewRoute>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, isError } = useProofDetail(params.proofId);
  const decide = useDecideProof(params.proofId);

  const [flags, setFlags] = useState<Record<string, string>>({});
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [asking, setAsking] = useState(false);
  const [comment, setComment] = useState('');

  const proof = data?.data;
  const students = useMemo(() => {
    const all = proof?.students ?? [];
    return onlyIncomplete
      ? all.filter(student => student.missing_fields?.length)
      : all;
  }, [proof, onlyIncomplete]);

  if (isLoading) {
    return (
      <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
        <StoreHeader title="ID card approval" />
        <LoadingState color="#7c3aed" />
      </View>
    );
  }
  if (isError || !proof) {
    return (
      <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
        <StoreHeader title="ID card approval" />
        <EmptyState
          icon={<AlertTriangle size={40} color="#9ca3af" />}
          message="This proof could not be opened"
        />
      </View>
    );
  }

  const flagged = Object.keys(flags);
  const isApproved = proof.status === 'approved';
  const iApproved = proof.my_decision === 'approved';
  const approvedBy = proof.decisions.find(
    row => row.decision === 'approved',
  )?.decided_by;
  const incomplete = proof.incomplete_count ?? 0;
  const cardWidth = width - 32 - 28;

  const toggleFlag = (studentId: string) =>
    setFlags(current => {
      const next = { ...current };
      if (studentId in next) {
        delete next[studentId];
      } else {
        next[studentId] = '';
      }
      return next;
    });

  const submit = (decision: 'approved' | 'changes_requested') =>
    decide.mutate(
      {
        decision,
        comment: comment.trim(),
        flagged_students:
          decision === 'changes_requested'
            ? flagged.map(student => ({ student, note: flags[student].trim() }))
            : [],
      },
      {
        onSuccess: response => {
          showToast('success', response.message);
          setAsking(false);
          if (decision === 'changes_requested') {
            setFlags({});
            setComment('');
          }
        },
        onError: error => showToast('error', getErrorMessage(error)),
      },
    );

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Status</Text>
          <ProofStatusPill
            status={proof.status}
            label={proof.status_label}
            cancelled={proof.order_status === 'cancelled'}
          />
        </View>
        {proof.status === 'approved' ? (
          <View style={[styles.banner, styles.bannerOk]}>
            <CheckCircle2 size={18} color="#166534" />
            <Text style={styles.bannerOkText}>
              Approved{approvedBy ? ` by ${approvedBy}` : ''}. EduCard will
              print and ship these cards.
            </Text>
          </View>
        ) : proof.status === 'changes_requested' ? (
          <View style={[styles.banner, styles.bannerBad]}>
            <XCircle size={18} color="#991b1b" />
            <Text style={styles.bannerBadText}>
              Changes requested. EduCard will fix them and send a new version.
            </Text>
          </View>
        ) : null}
        <InfoPoints
          items={[
            <InfoPointText key="sent">
              Sent by EduCard on{' '}
              <Text style={styles.bold}>{formatDate(proof.sent_at)}</Text>{' '}
              (version {proof.version}).
            </InfoPointText>,
            <InfoPointText key="check">
              Check every student’s card,{' '}
              <Text style={styles.bold}>front and back</Text>.
            </InfoPointText>,
            'Details come from your student records: fix a wrong name or a missing photo in the student’s profile.',
            proof.approval_rule_text,
          ]}
        />
        {proof.notes ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>
              <Text style={styles.bold}>Note from EduCard: </Text>
              {proof.notes}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {proof.approval_rule === 'any'
            ? 'Approval needed (any one)'
            : 'Approvals needed'}
        </Text>
        {proof.decisions.map(row => (
          <DecisionRow key={row.role} row={row} />
        ))}
      </View>

      {incomplete > 0 ? (
        <View style={[styles.banner, styles.bannerWarn, styles.bannerColumn]}>
          <View style={styles.rowStart}>
            <AlertTriangle size={18} color="#92400e" />
            <Text style={styles.bannerWarnText}>
              <Text style={styles.bold}>
                {incomplete} of {proof.student_count} cards
              </Text>{' '}
              are missing details (they would print without them). Fix the
              profiles, or flag those cards.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => setOnlyIncomplete(value => !value)}
          >
            <Text style={styles.outlineButtonText}>
              {onlyIncomplete ? 'Show all cards' : 'Show only incomplete'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rowStart}>
          <CheckCircle2 size={18} color="#16a34a" />
          <Text style={styles.okText}>
            Every card has all the details its design prints.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStudent = ({ item }: { item: ProofStudent }) => {
    const isFlagged = item.public_id in flags;
    const missing = item.missing_fields ?? [];
    return (
      <View
        style={[
          styles.studentCard,
          missing.length > 0 && styles.studentIncomplete,
          isFlagged && styles.studentFlagged,
        ]}
      >
        <CardSides
          frontPath={item.front_preview_url}
          backPath={item.back_preview_url || null}
          orientation={proof.orientation}
          width={cardWidth}
        />
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.studentName}>{item.name}</Text>
            {item.roll_number ? (
              <Text style={styles.studentRoll}>Roll {item.roll_number}</Text>
            ) : null}
          </View>
          {proof.can_decide ? (
            <TouchableOpacity
              style={[styles.flagButton, isFlagged && styles.flagButtonOn]}
              onPress={() => toggleFlag(item.public_id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isFlagged }}
            >
              <Flag size={15} color={isFlagged ? '#fff' : '#374151'} />
              <Text style={[styles.flagText, isFlagged && styles.flagTextOn]}>
                {isFlagged ? 'Flagged' : 'Flag'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {missing.length > 0 ? (
          <View style={styles.missing}>
            <AlertTriangle size={14} color="#92400e" />
            <Text style={styles.missingText}>
              <Text style={styles.bold}>Missing: </Text>
              {missing.map(field => field.label).join(', ')}
            </Text>
          </View>
        ) : null}
        {isFlagged ? (
          <TextInput
            style={styles.input}
            placeholder="What is wrong with this card?"
            placeholderTextColor="#9ca3af"
            maxLength={300}
            value={flags[item.public_id]}
            onChangeText={text =>
              setFlags(current => ({ ...current, [item.public_id]: text }))
            }
          />
        ) : null}
      </View>
    );
  };

  const barMessage =
    flagged.length > 0
      ? `${flagged.length} card${
          flagged.length === 1 ? '' : 's'
        } flagged for changes`
      : iApproved
        ? 'You approved these cards. You can still ask for changes until printing starts.'
        : isApproved
          ? `Approved by ${
              approvedBy || 'the school'
            }. Your approval is not needed.`
          : `${proof.student_count} card${
              proof.student_count === 1 ? '' : 's'
            } to approve`;

  return (
    <KeyboardAvoidingView
      style={[layoutStyles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StoreHeader
        title={proof.class_name || 'ID card approval'}
        subtitle={`Order ${proof.order_number} · ${proof.student_count} students · v${proof.version}`}
      />
      <FlatList
        data={students}
        keyExtractor={item => item.public_id}
        renderItem={renderStudent}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        initialNumToRender={4}
        windowSize={5}
      />

      {proof.can_decide ? (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
          {asking ? (
            <TextInput
              style={[styles.input, styles.commentInput]}
              placeholder="Say what needs to change (you can also flag cards above)"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1000}
              value={comment}
              onChangeText={setComment}
              autoFocus
            />
          ) : null}
          <Text style={styles.barMessage}>{barMessage}</Text>
          <View style={styles.barButtons}>
            {asking ? (
              <>
                <TouchableOpacity
                  style={styles.secondary}
                  onPress={() => setAsking(false)}
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primary, styles.danger]}
                  disabled={decide.isPending}
                  onPress={() => submit('changes_requested')}
                >
                  {decide.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>Send change request</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.secondary}
                  onPress={() => setAsking(true)}
                >
                  <Text style={styles.secondaryText}>Request changes</Text>
                </TouchableOpacity>
                {isApproved ? (
                  <View style={[styles.primary, styles.approved]}>
                    <CheckCircle2 size={18} color="#fff" />
                    <Text style={styles.primaryText}>Approved</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.primary,
                      flagged.length > 0 && styles.disabled,
                    ]}
                    disabled={decide.isPending || flagged.length > 0}
                    onPress={() => submit('approved')}
                  >
                    {decide.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color="#fff" />
                        <Text style={styles.primaryText}>
                          Approve all {proof.student_count}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.barMessage}>
            {proof.order_status === 'cancelled'
              ? 'This order was cancelled.'
              : proof.my_role
                ? `The order is ${proof.order_status_label.toLowerCase()}, so the approval can no longer be changed. Please call EduCard.`
                : 'Only the school admin and the class teacher can approve these cards.'}
          </Text>
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryText}>Back to approvals</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  list: { padding: 16, paddingBottom: 200, gap: 14 },
  headerBlock: { gap: 14, marginBottom: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowStart: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
  },
  bannerColumn: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  bannerOk: { backgroundColor: '#f0fdf4' },
  bannerOkText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#166534' },
  bannerBad: { backgroundColor: '#fef2f2' },
  bannerBadText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#991b1b' },
  bannerWarn: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bannerWarnText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#92400e' },
  okText: { flex: 1, fontSize: 14, color: '#15803d' },
  note: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12 },
  noteText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  decision: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  decisionRole: { fontSize: 15, fontWeight: '600', color: '#111827' },
  decisionState: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  comment: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#374151',
    marginTop: 4,
  },
  outlineButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  outlineButtonText: { fontSize: 14, fontWeight: '600', color: '#92400e' },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 12,
  },
  studentIncomplete: { borderColor: '#fcd34d' },
  studentFlagged: { borderColor: '#fda4af', borderWidth: 2 },
  studentName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  studentRoll: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  flagButtonOn: { backgroundColor: '#e11d48', borderColor: '#e11d48' },
  flagText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  flagTextOn: { color: '#fff' },
  missing: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 10,
  },
  missingText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  commentInput: { minHeight: 64, textAlignVertical: 'top' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    elevation: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  barMessage: { fontSize: 14, fontWeight: '600', color: '#111827' },
  barButtons: { flexDirection: 'row', gap: 10 },
  primary: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  approved: { backgroundColor: '#16a34a' },
  danger: { backgroundColor: '#dc2626' },
  disabled: { opacity: 0.5 },
  secondary: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  secondaryText: { fontSize: 15, fontWeight: '600', color: '#111827' },
});
