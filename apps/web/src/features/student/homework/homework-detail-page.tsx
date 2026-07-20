import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common';
import { useHomeworkDetail, useStudentHomework, useSubmitHomework } from './hooks';
import { getSubjectTheme } from '../utils/subject-theme';

function formatDateTime(dtStr: string): string {
  return new Date(dtStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function HomeworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dateParam = searchParams.get('date') || undefined;

  const { data: homework, isLoading } = useHomeworkDetail(id || null);
  const { data: homeworkList } = useStudentHomework(dateParam);
  const submitMutation = useSubmitHomework();

  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showResubmit, setShowResubmit] = useState(false);

  // Prev/Next navigation
  const { prevId, nextId, currentIndex, total } = useMemo(() => {
    if (!homeworkList || !id) {
      return { prevId: null, nextId: null, currentIndex: -1, total: 0 };
    }
    const idx = homeworkList.findIndex((hw) => hw.public_id === id);
    return {
      prevId: idx > 0 ? homeworkList[idx - 1].public_id : null,
      nextId: idx < homeworkList.length - 1 ? homeworkList[idx + 1].public_id : null,
      currentIndex: idx,
      total: homeworkList.length,
    };
  }, [homeworkList, id]);

  const goTo = (targetId: string) => {
    const params = dateParam ? `?date=${dateParam}` : '';
    navigate(`/student/homework/${targetId}${params}`, { replace: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleSubmit = () => {
    if (!id) {
      return;
    }
    submitMutation.mutate(
      { publicId: id, data: { notes: notes || undefined, file: file || undefined } },
      {
        onSuccess: () => {
          setNotes('');
          setFile(null);
          setShowResubmit(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="space-y-6">
        <PageHeader title="Homework" icon={BookOpen} />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-sm text-gray-500">Homework not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const theme = getSubjectTheme(homework.subject_name);
  const SubjectIcon = theme.icon;
  const submission = homework.my_submission;
  const canSubmitOnline =
    homework.submission_type === 'online' || homework.submission_type === 'both';
  const isReviewed = submission?.status === 'reviewed';
  const showSubmitForm =
    canSubmitOnline && homework.is_accepting_submissions && (!submission || showResubmit);

  return (
    <div className="space-y-6">
      <PageHeader title="Homework Details" icon={BookOpen} />

      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* Prev / Next Subject Navigation */}
        {total > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevId}
              onClick={() => prevId && goTo(prevId)}
              className="gap-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600">
              {currentIndex + 1} / {total}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextId}
              onClick={() => nextId && goTo(nextId)}
              className="gap-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Homework Info Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-2.5 ${theme.bgColor}`}>
              <SubjectIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{homework.title}</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                {theme.emoji} {homework.subject_name}
                {homework.chapter && (
                  <span className="ml-2 text-gray-400">• {homework.chapter}</span>
                )}
              </p>
            </div>
            {homework.is_overdue && (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="mr-1 h-3 w-3" /> Overdue
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {/* Meta info */}
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Due</p>
                <p className="font-medium text-gray-700">{formatDateTime(homework.due_datetime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Teacher</p>
                <p className="font-medium text-gray-700">{homework.assigned_by_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <Upload className="h-4 w-4 text-violet-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Submission</p>
                <p className="font-medium text-gray-700">
                  {homework.submission_type === 'online'
                    ? 'Online'
                    : homework.submission_type === 'both'
                      ? 'Online / Offline'
                      : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Priority</p>
                <p className="font-medium text-gray-700 capitalize">{homework.priority}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {homework.description && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Description</h3>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {homework.description}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {homework.instructions && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Instructions</h3>
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {homework.instructions}
                </p>
              </div>
            </div>
          )}

          {/* Reference link */}
          {homework.reference_link && (
            <a
              href={homework.reference_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-600 hover:bg-blue-100"
            >
              <ExternalLink className="h-4 w-4" />
              View Reference Material
            </a>
          )}

          {/* Teacher Attachments */}
          {homework.attachments.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {homework.attachments.map((att) => (
                  <a
                    key={att.public_id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
                  >
                    <Paperclip className="h-4 w-4" />
                    {att.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Submission (shown when reviewed) */}
      {submission &&
        !showResubmit &&
        (() => {
          const outcome = submission.review_outcome;
          const isRejected = outcome === 'rejected';
          const isApproved = outcome === 'approved';
          const headerBg = isRejected
            ? 'bg-gradient-to-r from-red-50 to-orange-50'
            : isApproved
              ? 'bg-gradient-to-r from-emerald-50 to-green-50'
              : isReviewed
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50'
                : 'bg-gradient-to-r from-emerald-50 to-green-50';
          const outcomeBadge = isRejected
            ? { bg: 'bg-red-100 text-red-700', label: '❌ Rejected' }
            : isApproved
              ? { bg: 'bg-emerald-100 text-emerald-700', label: '✅ Approved' }
              : isReviewed
                ? { bg: 'bg-blue-100 text-blue-700', label: '📋 Reviewed' }
                : { bg: 'bg-emerald-100 text-emerald-700', label: '📤 Submitted' };
          const feedbackBorder = isRejected
            ? 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50'
            : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50';
          const feedbackTextColor = isRejected ? 'text-red-700' : 'text-blue-700';
          const feedbackIconColor = isRejected ? 'text-red-600' : 'text-blue-600';

          return (
            <Card className={`overflow-hidden ${isRejected ? 'border-red-200' : ''}`}>
              <CardHeader className={`border-b ${headerBg}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2
                      className={`h-5 w-5 ${isRejected ? 'text-red-400' : 'text-emerald-500'}`}
                    />
                    Your Submission
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {submission.is_late && (
                      <Badge className="bg-amber-100 text-xs text-amber-700">⚠️ Late</Badge>
                    )}
                    <Badge className={outcomeBadge.bg}>{outcomeBadge.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Submitted on {formatDateTime(submission.submitted_at)}
                  </span>
                  {submission.reviewed_by_name && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-300">•</span>
                      Reviewed by{' '}
                      <span className="font-medium text-gray-700">
                        {submission.reviewed_by_name}
                      </span>
                    </span>
                  )}
                  {submission.reviewed_at && (
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-300">•</span>
                      on {formatDateTime(submission.reviewed_at)}
                    </span>
                  )}
                </div>

                {submission.notes && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="mb-1 text-xs font-medium text-gray-500">Your Notes</p>
                    <p className="text-sm whitespace-pre-wrap text-gray-700">{submission.notes}</p>
                  </div>
                )}

                {submission.attachments && submission.attachments.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">Your Files</p>
                    <div className="flex flex-wrap gap-2">
                      {submission.attachments.map((att) => (
                        <a
                          key={att.public_id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {att.file_name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Feedback */}
                {isReviewed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-4 ${feedbackBorder}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className={`h-4 w-4 ${feedbackIconColor}`} />
                      <span className={`text-sm font-semibold ${feedbackTextColor}`}>
                        Teacher&apos;s Feedback
                      </span>
                    </div>
                    {submission.feedback ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                        {submission.feedback}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No written feedback provided</p>
                    )}
                  </motion.div>
                )}

                {/* Re-submit button (shown for rejected) */}
                {isReviewed &&
                  isRejected &&
                  canSubmitOnline &&
                  homework.is_accepting_submissions && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                        onClick={() => setShowResubmit(true)}
                      >
                        <Upload className="h-4 w-4" />
                        Re-submit Homework
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })()}

      {/* Submission History (past rejected submissions) */}
      {homework.submission_history && homework.submission_history.length > 0 && (
        <Card className="overflow-hidden border-gray-200">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-sm text-gray-600">
              📜 Previous Submissions ({homework.submission_history.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {homework.submission_history.map((past, idx) => (
              <div key={past.public_id} className="space-y-2 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Attempt #{homework.submission_history.length - idx} —{' '}
                    {formatDateTime(past.submitted_at)}
                  </span>
                  {past.review_outcome && (
                    <Badge
                      className={
                        past.review_outcome === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }
                    >
                      {past.review_outcome === 'rejected' ? '❌ Rejected' : '✅ Approved'}
                    </Badge>
                  )}
                </div>
                {past.notes && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Notes:</span> {past.notes}
                  </p>
                )}
                {past.feedback && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                    <p className="text-[10px] font-medium text-gray-500">
                      Feedback{past.reviewed_by_name ? ` by ${past.reviewed_by_name}` : ''}
                    </p>
                    <p className="text-xs text-gray-700">{past.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submission Form (new or re-submit) */}
      {showSubmitForm ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-base">
                {showResubmit ? 'Re-submit Your Work' : 'Submit Your Work'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for your teacher..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Attachment <span className="text-gray-400">(optional)</span>
                </label>
                {file ? (
                  <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="rounded-full p-1 hover:bg-orange-100"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-8 text-sm text-gray-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Click to upload a file (PDF, DOC, JPG, PNG, ZIP)
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {showResubmit && (
                  <Button variant="ghost" onClick={() => setShowResubmit(false)}>
                    Cancel
                  </Button>
                )}
                <div className="ml-auto">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-amber-600"
                  >
                    {submitMutation.isPending
                      ? 'Submitting...'
                      : showResubmit
                        ? 'Re-submit'
                        : 'Submit Homework'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : !submission && canSubmitOnline && !homework.is_accepting_submissions ? (
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="flex items-center gap-3 p-5">
            <XCircle className="h-6 w-6 text-red-400" />
            <div>
              <p className="font-medium text-red-700">Submission deadline has passed</p>
              <p className="text-sm text-red-500">You can no longer submit this homework online</p>
            </div>
          </CardContent>
        </Card>
      ) : !submission && !canSubmitOnline ? (
        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="flex items-center gap-3 p-5">
            <FileText className="h-6 w-6 text-gray-400" />
            <div>
              <p className="font-medium text-gray-700">Offline submission required</p>
              <p className="text-sm text-gray-500">Submit this homework directly to your teacher</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
