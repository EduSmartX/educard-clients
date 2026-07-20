/**
 * Student Homework Detail Screen
 * View details, submit work, see teacher feedback
 */

import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Clock,
  BookOpen,
  Upload,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Screen, Header } from '@/components/layout';
import { colors } from '@/constants/colors';
import {
  useHomeworkDetail,
  useStudentHomework,
  useSubmitHomework,
} from '@/features/student-portal';

type HomeworkSubmission = NonNullable<
  ReturnType<typeof useHomeworkDetail>['data']
>['my_submission'];

function SubmissionStatusCard({
  submission,
  isReviewed,
  canSubmitOnline,
  acceptingSubmissions,
  onResubmit,
}: Readonly<{
  submission: NonNullable<HomeworkSubmission>;
  isReviewed: boolean;
  canSubmitOnline: boolean;
  acceptingSubmissions: boolean;
  onResubmit: () => void;
}>) {
  return (
    <View className="mx-4 mt-4 rounded-xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <CheckCircle size={18} color={colors.success[500]} />
          <Text className="text-sm font-semibold text-emerald-700">Your Submission</Text>
        </View>
        <View className={`rounded-lg px-2.5 py-1 ${isReviewed ? 'bg-blue-100' : 'bg-emerald-100'}`}>
          <Text
            className={`text-[10px] font-semibold ${isReviewed ? 'text-blue-700' : 'text-emerald-700'}`}
          >
            {isReviewed ? 'Reviewed' : 'Submitted'}
          </Text>
        </View>
      </View>

      <Text className="mt-2 text-xs text-gray-400">
        Submitted on {format(new Date(submission.submitted_at), 'd MMM yyyy, h:mm a')}
        {submission.is_late ? ' (Late)' : ''}
      </Text>

      {submission.notes ? (
        <View className="mt-3 rounded-lg bg-gray-50 p-3">
          <Text className="mb-1 text-[10px] font-medium text-gray-500">Your Notes</Text>
          <Text className="text-sm text-gray-700">{submission.notes}</Text>
        </View>
      ) : null}

      {isReviewed && (
        <View className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <View className="flex-row items-center gap-1.5">
            <MessageSquare size={14} color={colors.primary[600]} />
            <Text className="text-xs font-semibold text-blue-700">Teacher&apos;s Feedback</Text>
          </View>
          <Text className="mt-1.5 text-sm text-gray-700">
            {submission.feedback || 'No written feedback provided'}
          </Text>
        </View>
      )}

      {isReviewed && canSubmitOnline && acceptingSubmissions && (
        <TouchableOpacity
          onPress={onResubmit}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3"
        >
          <Upload size={16} color={colors.warning[600]} />
          <Text className="text-sm font-medium text-orange-600">Re-submit Homework</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function StudentHomeworkDetailScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const router = useRouter();

  const { data: homework, isLoading } = useHomeworkDetail(id || null);
  const { data: homeworkList } = useStudentHomework(date);
  const submitMutation = useSubmitHomework();

  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [showResubmit, setShowResubmit] = useState(false);

  // Prev/Next
  const { prevId, nextId, idx, total } = useMemo(() => {
    if (!homeworkList || !id) return { prevId: null, nextId: null, idx: -1, total: 0 };
    const i = homeworkList.findIndex((hw) => hw.public_id === id);
    return {
      prevId: i > 0 ? homeworkList[i - 1].public_id : null,
      nextId: i < homeworkList.length - 1 ? homeworkList[i + 1].public_id : null,
      idx: i,
      total: homeworkList.length,
    };
  }, [homeworkList, id]);

  const goTo = (targetId: string) => {
    router.replace(
      `/(shared-screens)/student/homework-detail?id=${targetId}&date=${date || ''}` as never
    );
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      setFile({ uri: a.uri, name: a.name, type: a.mimeType || 'application/octet-stream' });
    }
  };

  const handleSubmit = () => {
    if (!id) return;
    submitMutation.mutate(
      { publicId: id, data: { notes: notes || undefined, file: file || undefined } },
      {
        onSuccess: () => {
          setNotes('');
          setFile(null);
          setShowResubmit(false);
          Alert.alert('Success', 'Homework submitted!');
        },
        onError: () => Alert.alert('Error', 'Failed to submit. Please try again.'),
      }
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <Header title="Homework" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      </Screen>
    );
  }

  if (!homework) {
    return (
      <Screen>
        <Header title="Homework" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl">📭</Text>
          <Text className="mt-2 text-sm text-gray-500">Homework not found</Text>
        </View>
      </Screen>
    );
  }

  const submission = homework.my_submission;
  const canSubmitOnline =
    homework.submission_type === 'online' || homework.submission_type === 'both';
  const isReviewed = submission?.status === 'reviewed';
  const showForm =
    canSubmitOnline && homework.is_accepting_submissions && (!submission || showResubmit);

  return (
    <Screen>
      <Header title="Homework Details" showBack />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Prev/Next */}
        {total > 1 && (
          <View className="mx-4 mt-3 flex-row items-center justify-between">
            <TouchableOpacity
              disabled={!prevId}
              onPress={() => prevId && goTo(prevId)}
              className={`flex-row items-center rounded-lg border px-3 py-2 ${prevId ? 'border-orange-200 bg-orange-50' : 'border-gray-100 opacity-40'}`}
            >
              <ChevronLeft size={14} color={colors.warning[600]} />
              <Text className="ml-1 text-xs font-medium text-orange-600">Prev</Text>
            </TouchableOpacity>
            <View className="rounded-full bg-orange-100 px-3 py-1">
              <Text className="text-xs font-medium text-orange-600">
                {idx + 1} / {total}
              </Text>
            </View>
            <TouchableOpacity
              disabled={!nextId}
              onPress={() => nextId && goTo(nextId)}
              className={`flex-row items-center rounded-lg border px-3 py-2 ${nextId ? 'border-orange-200 bg-orange-50' : 'border-gray-100 opacity-40'}`}
            >
              <Text className="mr-1 text-xs font-medium text-orange-600">Next</Text>
              <ChevronRight size={14} color={colors.warning[600]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Homework Info */}
        <View className="mx-4 mt-4 rounded-xl border border-gray-100 bg-white p-4">
          <Text className="text-lg font-bold text-gray-800">{homework.title}</Text>
          <Text className="mt-1 text-sm text-gray-500">
            {homework.subject_name}
            {homework.chapter ? ` • ${homework.chapter}` : ''}
          </Text>
          {homework.is_overdue && (
            <View className="mt-2 flex-row items-center">
              <AlertTriangle size={14} color={colors.danger[500]} />
              <Text className="ml-1 text-xs font-medium text-red-600">Overdue</Text>
            </View>
          )}

          {/* Meta */}
          <View className="mt-4 flex-row flex-wrap gap-3">
            <View className="flex-row items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
              <Clock size={14} color={colors.warning[500]} />
              <View>
                <Text className="text-[9px] uppercase text-gray-400">Due</Text>
                <Text className="text-xs font-medium text-gray-700">
                  {format(new Date(homework.due_datetime), 'd MMM, h:mm a')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
              <BookOpen size={14} color={colors.primary[500]} />
              <View>
                <Text className="text-[9px] uppercase text-gray-400">Teacher</Text>
                <Text className="text-xs font-medium text-gray-700">
                  {homework.assigned_by_name}
                </Text>
              </View>
            </View>
          </View>

          {homework.description ? (
            <View className="mt-4 rounded-lg bg-gray-50 p-3">
              <Text className="text-sm text-gray-700">{homework.description}</Text>
            </View>
          ) : null}

          {homework.instructions ? (
            <View className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <Text className="mb-1 text-[10px] font-semibold text-blue-600">Instructions</Text>
              <Text className="text-sm text-gray-700">{homework.instructions}</Text>
            </View>
          ) : null}
        </View>

        {/* Submission Status */}
        {submission && !showResubmit && (
          <SubmissionStatusCard
            submission={submission}
            isReviewed={isReviewed}
            canSubmitOnline={canSubmitOnline}
            acceptingSubmissions={homework.is_accepting_submissions}
            onResubmit={() => setShowResubmit(true)}
          />
        )}

        {/* Submit Form */}
        {showForm && (
          <View className="mx-4 mt-4 rounded-xl border border-gray-100 bg-white p-4">
            <Text className="text-sm font-semibold text-gray-800">
              {showResubmit ? 'Re-submit Your Work' : 'Submit Your Work'}
            </Text>

            <Text className="mb-1.5 mt-4 text-xs font-medium text-gray-600">Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes for your teacher..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700"
              placeholderTextColor={colors.gray[400]}
            />

            <Text className="mb-1.5 mt-4 text-xs font-medium text-gray-600">
              Attachment (optional)
            </Text>
            {file ? (
              <View className="flex-row items-center rounded-lg border border-orange-200 bg-orange-50 p-3">
                <FileText size={18} color={colors.warning[600]} />
                <Text className="ml-2 flex-1 text-sm text-gray-700" numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <XCircle size={18} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => void pickFile()}
                className="items-center rounded-lg border-2 border-dashed border-gray-200 py-6"
              >
                <Upload size={20} color={colors.gray[400]} />
                <Text className="mt-1 text-xs text-gray-500">Tap to upload a file</Text>
              </TouchableOpacity>
            )}

            <View className="mt-5 flex-row gap-3">
              {showResubmit && (
                <TouchableOpacity
                  onPress={() => setShowResubmit(false)}
                  className="flex-1 items-center rounded-xl border border-gray-200 py-3"
                >
                  <Text className="text-sm font-medium text-gray-600">Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 items-center rounded-xl bg-orange-500 py-3"
                style={{ opacity: submitMutation.isPending ? 0.6 : 1 }}
              >
                <Text className="text-sm font-semibold text-white">
                  {(() => {
                    if (submitMutation.isPending) return 'Submitting...';
                    return showResubmit ? 'Re-submit' : 'Submit';
                  })()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Offline message */}
        {!submission && !canSubmitOnline && (
          <View className="mx-4 mt-4 flex-row items-center rounded-xl bg-gray-50 p-4">
            <FileText size={20} color={colors.gray[400]} />
            <View className="ml-3">
              <Text className="text-sm font-medium text-gray-700">Offline submission required</Text>
              <Text className="text-xs text-gray-500">Submit directly to your teacher</Text>
            </View>
          </View>
        )}

        {/* Deadline passed */}
        {!submission && canSubmitOnline && !homework.is_accepting_submissions && (
          <View className="mx-4 mt-4 flex-row items-center rounded-xl bg-red-50 p-4">
            <XCircle size={20} color={colors.danger[500]} />
            <Text className="ml-3 text-sm font-medium text-red-700">
              Submission deadline has passed
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}
