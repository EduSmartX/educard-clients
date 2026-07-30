/**
 * useCreateHomeworkForm - encapsulates create-homework form state, validation and submission.
 */

import {
  HOMEWORK_STATUS,
  HOMEWORK_PRIORITY,
  SUBMISSION_TYPE,
} from '@educard/shared';
import type {
  HomeworkCreatePayload,
  HomeworkStatus,
  HomeworkPriority,
  SubmissionType,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useState, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';

import { type SelectedFile } from '@/components/forms';
import {
  useTeacherClasses,
  useCreateHomework,
  useUploadHomeworkAttachment,
} from '@/features/homework';
import { useFormErrors } from '@/hooks';
import { useToast } from '@/lib/toast-context';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';

export function getTodayDate(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function useCreateHomeworkForm() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'HomeworkCreate'>>();
  const params = useMemo(() => route.params ?? {}, [route.params]);
  const { showToast } = useToast();

  const { data: teacherClasses = [], isLoading: classesLoading } =
    useTeacherClasses();
  const createMutation = useCreateHomework();
  const uploadMutation = useUploadHomeworkAttachment();

  const {
    errors,
    setFieldError,
    clearFieldError,
    handleApiError,
    validateRequired,
  } = useFormErrors({
    fieldMap: {
      subject_public_id: 'subject',
      due_datetime: 'dueDate',
    },
  });

  const [selectedClass] = useState<string>(params.class || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    params.subject || '',
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [assignedDate, setAssignedDate] = useState(
    params.date || getTodayDate(),
  );
  const [dueDate, setDueDate] = useState(getTomorrowDate());
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<string>(HOMEWORK_PRIORITY.MEDIUM);
  const [submissionType, setSubmissionType] = useState<string>(
    SUBMISSION_TYPE.OFFLINE,
  );
  const [chapter, setChapter] = useState('');
  const [referenceLink, setReferenceLink] = useState('');
  const [status, setStatus] = useState<string>(HOMEWORK_STATUS.PUBLISHED);
  const [attachments, setAttachments] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (params.subject && !selectedSubject) {
      setSelectedSubject(params.subject);
    }
    if (params.date && assignedDate === getTodayDate()) {
      setAssignedDate(params.date);
    }
  }, [params, selectedSubject, assignedDate]);

  const selectedClassData = useMemo(
    () => teacherClasses.find(c => c.public_id === selectedClass),
    [teacherClasses, selectedClass],
  );

  const availableSubjects = useMemo(() => {
    if (!selectedClassData) return [];
    return selectedClassData.subjects;
  }, [selectedClassData]);

  const selectedSubjectData = useMemo(
    () => availableSubjects.find(s => s.public_id === selectedSubject),
    [availableSubjects, selectedSubject],
  );

  const canCreate = useMemo(() => {
    if (!selectedClass || !selectedSubject || !title.trim()) return false;
    return true;
  }, [selectedClass, selectedSubject, title]);

  const uploadAttachments = async (homeworkId: string) => {
    if (attachments.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as unknown as Blob);

        await uploadMutation.mutateAsync({ publicId: homeworkId, formData });
      }
    } catch {
      Alert.alert(
        'Warning',
        'Homework created but some attachments failed to upload',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = validateRequired([
      { name: 'subject', value: selectedSubject, label: 'Subject' },
      { name: 'title', value: title, label: 'Title' },
    ]);

    if (!isValid) return;

    if (referenceLink.trim() && !/^https?:\/\/.+/i.test(referenceLink.trim())) {
      setFieldError(
        'reference_link',
        'Enter a valid URL (must start with http:// or https://)',
      );
      return;
    }

    const todayStr = getTodayDate();
    if (assignedDate < todayStr) {
      setFieldError('assigned_date', 'Assigned date cannot be in the past');
      showToast({
        type: 'error',
        title: 'Invalid date',
        message: 'Assigned date cannot be in the past',
      });
      return;
    }
    const dueDateTime = new Date(`${dueDate}T${dueTime}:00`);
    if (
      !Number.isNaN(dueDateTime.getTime()) &&
      dueDateTime.getTime() < Date.now()
    ) {
      setFieldError('dueDate', 'Due date and time cannot be in the past');
      showToast({
        type: 'error',
        title: 'Invalid date',
        message: 'Due date and time cannot be in the past',
      });
      return;
    }

    const payload: HomeworkCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      subject_public_id: selectedSubject,
      due_datetime: `${dueDate}T${dueTime}:00`,
      assigned_date: assignedDate,
      status: status as HomeworkStatus,
      priority: priority as HomeworkPriority,
      submission_type: submissionType as SubmissionType,
      reference_link: referenceLink.trim() || undefined,
      chapter: chapter.trim() || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: data => {
        if (attachments.length > 0 && data?.public_id)
          void uploadAttachments(data.public_id);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Homework created successfully',
        });
        if (navigation.canGoBack()) navigation.goBack();
      },
      onError: (error: unknown) => {
        handleApiError(error, 'Failed to create homework');
      },
    });
  };

  return {
    selectedClass,
    selectedSubject,
    setSelectedSubject,
    title,
    setTitle,
    description,
    setDescription,
    instructions,
    setInstructions,
    assignedDate,
    setAssignedDate,
    dueDate,
    setDueDate,
    dueTime,
    setDueTime,
    priority,
    setPriority,
    submissionType,
    setSubmissionType,
    chapter,
    setChapter,
    referenceLink,
    setReferenceLink,
    status,
    setStatus,
    attachments,
    setAttachments,
    isUploading,
    classesLoading,
    selectedClassData,
    availableSubjects,
    selectedSubjectData,
    canCreate,
    errors,
    clearFieldError,
    isPending: createMutation.isPending,
    handleSubmit,
  };
}
