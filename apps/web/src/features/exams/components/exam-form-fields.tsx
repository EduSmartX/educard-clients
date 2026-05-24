/**
 * ExamFormFields - The form fields section of the exam form
 * Extracted to reduce cognitive complexity of ExamFormPage
 */

import { format } from 'date-fns';
import { CalendarDays, AlertTriangle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  EXAM_STATUS_OPTIONS,
  EXAM_STATUS_LABELS,
  type ExamStatus,
  type Exam,
  type ExamSession,
  type Class,
  type SubjectItem,
} from '@educard/shared';

interface ExamFormFieldsProps {
  isView: boolean;
  isEdit: boolean;
  existingExam: Exam | undefined;
  sessionId: string;
  setSessionId: (v: string) => void;
  classId: string;
  setClassId: (v: string) => void;
  subjectId: string;
  setSubjectId: (v: string) => void;
  status: ExamStatus | '';
  setStatus: (v: ExamStatus | '') => void;
  maxMarks: string;
  setMaxMarks: (v: string) => void;
  passingMarks: string;
  setPassingMarks: (v: string) => void;
  examDate: Date | null;
  onExamDateChange: (d: Date | null) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  sessionsList: ExamSession[];
  classesList: Class[];
  subjectsList: SubjectItem[];
  selectedSession: ExamSession | undefined;
  selectedSubject: SubjectItem | undefined;
  checkDuplicateExam: Exam | null | undefined;
  fieldErrors: Record<string, string>;
  dateError: string | undefined;
}

export function ExamFormFields({
  isView,
  isEdit,
  existingExam,
  sessionId,
  setSessionId,
  classId,
  setClassId,
  subjectId,
  setSubjectId,
  status,
  setStatus,
  maxMarks,
  setMaxMarks,
  passingMarks,
  setPassingMarks,
  examDate,
  onExamDateChange,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  sessionsList,
  classesList,
  subjectsList,
  selectedSession,
  selectedSubject,
  checkDuplicateExam,
  fieldErrors,
  dateError,
}: ExamFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Exam Session */}
      <div className="space-y-2">
        <Label htmlFor="session_id">
          Exam Session <span className="text-red-500">*</span>
        </Label>
        {isView ? (
          <Input value={existingExam?.session_name || '-'} disabled className="bg-gray-50" />
        ) : (
          <SearchableSelect
            key={`session-${sessionId || 'empty'}`}
            options={sessionsList.map((session) => ({
              value: session.public_id,
              label: `${session.name} (${session.academic_year})`,
            }))}
            value={sessionId}
            onValueChange={setSessionId}
            disabled={isEdit}
            placeholder="Select session"
            searchPlaceholder="Search sessions..."
            className={fieldErrors.session_id ? 'border-red-500' : ''}
          />
        )}
        {!!fieldErrors.session_id && (
          <p className="text-sm text-red-500">{fieldErrors.session_id}</p>
        )}
        {selectedSession && (selectedSession.start_date || selectedSession.end_date) && (
          <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="font-medium">
              {format(new Date(selectedSession.start_date || ''), 'dd MMM yyyy')}
              {' → '}
              {format(new Date(selectedSession.end_date || ''), 'dd MMM yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* Class Selection */}
      <div className="space-y-2">
        <Label htmlFor="class_id">
          Class <span className="text-red-500">*</span>
        </Label>
        {isView ? (
          <Input value={existingExam?.class_name || '-'} disabled className="bg-gray-50" />
        ) : (
          <SearchableSelect
            key={`class-${classId || 'empty'}`}
            options={classesList.map((cls) => ({
              value: cls.public_id,
              label: `${cls.class_master?.name || 'Unknown'} - ${cls.name}`,
            }))}
            value={classId}
            onValueChange={(value: string) => {
              setClassId(value);
              setSubjectId('');
            }}
            disabled={isEdit}
            placeholder="Select class"
            searchPlaceholder="Search classes..."
            className={fieldErrors.class_id ? 'border-red-500' : ''}
          />
        )}
        {!!fieldErrors.class_id && <p className="text-sm text-red-500">{fieldErrors.class_id}</p>}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject_id">
          Subject <span className="text-red-500">*</span>
        </Label>
        {isView ? (
          <Input value={existingExam?.subject_name || '-'} disabled className="bg-gray-50" />
        ) : (
          <SearchableSelect
            key={`subject-${subjectId || 'empty'}`}
            options={subjectsList.map((subject) => ({
              value: subject.public_id,
              label: subject.subject_info.name,
            }))}
            value={subjectId}
            onValueChange={setSubjectId}
            disabled={isEdit || !classId}
            placeholder={classId ? 'Select subject' : 'Select class first'}
            searchPlaceholder="Search subjects..."
            className={fieldErrors.subject_id ? 'border-red-500' : ''}
          />
        )}
        {!!fieldErrors.subject_id && (
          <p className="text-sm text-red-500">{fieldErrors.subject_id}</p>
        )}
        {!!checkDuplicateExam && (
          <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              An exam for this subject already exists in this session. Creating will replace the
              existing exam.
            </span>
          </div>
        )}
        {!isView && selectedSubject && !checkDuplicateExam && (
          <p className="text-xs text-gray-500">Class: {selectedSubject.class_info.name}</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">
          Status <span className="text-red-500">*</span>
        </Label>
        {isView ? (
          <Input
            value={status ? EXAM_STATUS_LABELS[status as ExamStatus] : '-'}
            disabled
            className="bg-gray-50"
          />
        ) : (
          <SearchableSelect
            key={`status-${status || 'empty'}`}
            options={EXAM_STATUS_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            value={status}
            onValueChange={(v: string) => setStatus(v as ExamStatus)}
            placeholder="Select status"
            className={fieldErrors.status ? 'border-red-500' : ''}
          />
        )}
        {!!fieldErrors.status && <p className="text-sm text-red-500">{fieldErrors.status}</p>}
      </div>

      {/* Max Marks */}
      <div className="space-y-2">
        <Label htmlFor="max_marks">Maximum Marks</Label>
        <Input
          id="max_marks"
          type="number"
          min="1"
          value={maxMarks}
          onChange={(e) => setMaxMarks(e.target.value)}
          disabled={isView}
        />
      </div>

      {/* Passing Marks */}
      <div className="space-y-2">
        <Label htmlFor="passing_marks">Passing Marks</Label>
        <Input
          id="passing_marks"
          type="number"
          min="0"
          value={passingMarks}
          onChange={(e) => setPassingMarks(e.target.value)}
          disabled={isView}
        />
      </div>

      {/* Exam Date */}
      <div className="space-y-2">
        <Label htmlFor="exam_date">Exam Date</Label>
        <DatePicker
          value={examDate}
          onChange={onExamDateChange}
          placeholder="Select exam date"
          disabled={isView}
          className={dateError ? 'border-red-500' : ''}
        />
        {(dateError || fieldErrors.date) && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle className="h-3 w-3" />
            <span>{dateError || fieldErrors.date}</span>
          </div>
        )}
      </div>

      {/* Start Time */}
      <div className="space-y-2">
        <Label htmlFor="start_time">Start Time</Label>
        <Input
          id="start_time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={isView}
        />
      </div>

      {/* End Time */}
      <div className="space-y-2">
        <Label htmlFor="end_time">End Time</Label>
        <Input
          id="end_time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={isView}
        />
      </div>
    </div>
  );
}
