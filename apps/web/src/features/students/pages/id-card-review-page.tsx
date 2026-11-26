/**
 * ID Card Review (admin and class teachers).
 *
 * Pick a class, then step through its students with Previous / Next. Each student's details
 * are on the left and their ID card, rendered from the school's approved design, is on the
 * right. A mistake is fixed by editing the details in place; the card updates on save.
 *
 * The class and student live in the URL (?class=…&student=…), so a refresh or a shared link
 * opens the same card.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Edit, IdCard, Users } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryKeys, USER_ROLES } from '@/constants';
import { useAuth } from '@/hooks/use-auth';
import { fetchStudentCard } from '@/features/store/api/store-api';
import { MissingCardFields } from '@/features/store/components/missing-card-fields';
import { StudentCardReviewPanel } from '@/features/store/components/student-card-review-panel';
import { useStudentCard } from '@/features/store/hooks/use-store';
import type { Class } from '@/features/classes/types';
import { StudentForm } from '../components/student-form';
import { useClassRoster } from '../hooks/use-class-roster';
import { useManagedClasses } from '../hooks/use-managed-classes';
import { useStudent } from '../hooks/use-students';

function classLabel(cls: Class): string {
  if (cls.display_name) {
    return cls.display_name;
  }
  return cls.class_master?.name ? `${cls.class_master.name} - ${cls.name}` : cls.name;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export default function IdCardReviewPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);

  const { data: classes = [], isLoading: classesLoading } = useManagedClasses();
  const classId = searchParams.get('class') ?? undefined;
  const { data: roster = [], isLoading: rosterLoading } = useClassRoster(classId);

  // The selected student, or the first one in the class.
  const requestedStudent = searchParams.get('student');
  const index = Math.max(
    0,
    roster.findIndex((student) => student.public_id === requestedStudent)
  );
  const current = roster[index];
  const studentId = current?.public_id;

  const { data: student, isLoading: studentLoading } = useStudent(studentId);
  const {
    data: cardResponse,
    isLoading: cardLoading,
    isError: cardError,
  } = useStudentCard(studentId);

  const select = useCallback(
    (next: { class?: string; student?: string }) => {
      setIsEditing(false);
      const params = new URLSearchParams();
      const nextClass = next.class ?? classId;
      if (nextClass) {
        params.set('class', nextClass);
      }
      if (next.student) {
        params.set('student', next.student);
      }
      setSearchParams(params, { replace: true });
    },
    [classId, setSearchParams]
  );

  // Open the first class straight away.
  useEffect(() => {
    if (!classId && classes.length > 0) {
      select({ class: classes[0].public_id });
    }
  }, [classId, classes, select]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const target = roster[nextIndex];
      if (target && !isEditing) {
        select({ student: target.public_id });
      }
    },
    [roster, isEditing, select]
  );

  // Arrow keys step through students (not while typing or editing).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditing || isTypingTarget(event.target) || event.altKey || event.metaKey) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        goTo(index - 1);
      } else if (event.key === 'ArrowRight') {
        goTo(index + 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, index, isEditing]);

  // Load the next student's card in the background so Next feels instant.
  const nextId = roster[index + 1]?.public_id;
  useEffect(() => {
    if (nextId) {
      void queryClient.prefetchQuery({
        queryKey: QueryKeys.STORE.STUDENT_CARD(nextId),
        queryFn: () => fetchStudentCard(nextId),
      });
    }
  }, [nextId, queryClient]);

  const refreshStudent = useCallback(() => {
    if (!studentId) {
      return;
    }
    // New details (or a new photo) give the card a new version, so it re-renders.
    void queryClient.invalidateQueries({ queryKey: QueryKeys.STORE.STUDENT_CARD(studentId) });
    void queryClient.invalidateQueries({ queryKey: QueryKeys.STUDENTS.DETAIL(studentId) });
    void queryClient.invalidateQueries({ queryKey: QueryKeys.STUDENTS.LIST({ roster: classId }) });
  }, [classId, queryClient, studentId]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    // A photo uploaded while editing is saved straight away, even if the form is cancelled.
    refreshStudent();
  }, [refreshStudent]);

  const classOptions = useMemo(
    () => classes.map((cls) => ({ value: cls.public_id, label: classLabel(cls) })),
    [classes]
  );
  const studentOptions = useMemo(
    () =>
      roster.map((item) => ({
        value: item.public_id,
        label: item.roll_number ? `${item.roll_number} · ${item.full_name}` : item.full_name,
      })),
    [roster]
  );

  const isTeacher = user?.role === USER_ROLES.TEACHER;
  const noClasses = !classesLoading && classes.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ID Card Review"
        description="Go through a class student by student and check each ID card before it is printed. Fix any mistake in the student's details and the card updates."
        icon={IdCard}
        actions={
          current && !isEditing
            ? [{ label: 'Edit details', onClick: () => setIsEditing(true), icon: Edit }]
            : []
        }
      />

      {noClasses ? (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 py-10 text-sm">
            <Users className="h-5 w-5 shrink-0" aria-hidden />
            {isTeacher
              ? 'You are not the class teacher of any class. Only the school admin and class teachers can review ID cards.'
              : 'There are no classes yet. Create a class and add students to review their ID cards.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Class, student and Previous / Next */}
          <Card>
            <CardContent className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
              <div className="space-y-1.5">
                <Label>Class</Label>
                <SearchableSelect
                  options={classOptions}
                  value={classId}
                  onValueChange={(value) => select({ class: value })}
                  placeholder={classesLoading ? 'Loading classes…' : 'Select a class'}
                  searchPlaceholder="Search classes…"
                  disabled={classesLoading || isEditing}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Student</Label>
                <SearchableSelect
                  options={studentOptions}
                  value={studentId}
                  onValueChange={(value) => select({ student: value })}
                  placeholder={rosterLoading ? 'Loading students…' : 'Select a student'}
                  searchPlaceholder="Search by name or roll number…"
                  emptyText="No students found."
                  disabled={!classId || rosterLoading || roster.length === 0 || isEditing}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Previous student"
                  onClick={() => goTo(index - 1)}
                  disabled={isEditing || index <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground min-w-20 text-center text-sm tabular-nums">
                  {roster.length > 0 ? `${index + 1} of ${roster.length}` : '0 of 0'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Next student"
                  onClick={() => goTo(index + 1)}
                  disabled={isEditing || index >= roster.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {isEditing && (
                <p className="text-muted-foreground text-xs md:col-span-3">
                  Save or cancel your changes to move to another student.
                </p>
              )}
            </CardContent>
          </Card>

          {classId && !rosterLoading && roster.length === 0 && (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                There are no students in this class yet.
              </CardContent>
            </Card>
          )}

          {(rosterLoading || classesLoading) && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          )}

          {current && (
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
              {/* Card first on small screens, on the right (and kept in view) on wide ones */}
              <StudentCardReviewPanel
                card={cardResponse?.data}
                isLoading={cardLoading}
                isError={cardError}
                className="xl:sticky xl:top-4 xl:order-2"
              />
              <div className="min-w-0 xl:order-1">
                <StudentForm
                  key={`${studentId}-${isEditing ? 'edit' : 'view'}`}
                  mode={isEditing ? 'edit' : 'view'}
                  studentId={studentId}
                  initialData={student}
                  isLoading={studentLoading}
                  onSuccess={stopEditing}
                  onCancel={stopEditing}
                  beforeBasicInfo={<MissingCardFields card={cardResponse?.data} />}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
