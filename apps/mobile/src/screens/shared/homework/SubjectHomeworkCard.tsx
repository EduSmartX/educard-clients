/**
 * SubjectHomeworkCard - one subject row in the homework board (list) screen.
 */

import { Colors, getStatusLabel } from '@educard/shared';
import type { Homework } from '@educard/shared';
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  CheckCircle,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { styles } from './homework-list-styles';
import {
  getStatusBgColor,
  getStatusTextColor,
  type SubjectHomework,
} from './homework-list-utils';

interface SubjectHomeworkCardProps {
  item: SubjectHomework;
  index: number;
  isPastDate: boolean;
  onView: (hw: Homework) => void;
  onEdit: (hw: Homework) => void;
  onDelete: (hw: Homework) => void;
  onViewSubmissions: (hw: Homework) => void;
  onCreate: (subjectId: string) => void;
}

export function SubjectHomeworkCard({
  item,
  index,
  isPastDate,
  onView,
  onEdit,
  onDelete,
  onViewSubmissions,
  onCreate,
}: SubjectHomeworkCardProps) {
  const { subject, homework, color } = item;
  const canAdd = !isPastDate;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <View style={[styles.subjectCard, { borderLeftColor: color.hex }]}>
        {/* Subject Header */}
        <View style={styles.subjectHeader}>
          <View style={[styles.subjectIcon, { backgroundColor: color.bg }]}>
            <BookOpen size={16} color={color.hex} />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={[styles.subjectName, { color: color.hex }]}>
              {subject.subject_name}
            </Text>
            {!!subject.teacher_name && (
              <Text style={styles.teacherName}>{subject.teacher_name}</Text>
            )}
          </View>
          {!!subject.is_teacher && (
            <View style={[styles.teacherBadge, { backgroundColor: color.bg }]}>
              <Text style={[styles.teacherBadgeText, { color: color.hex }]}>
                You
              </Text>
            </View>
          )}
        </View>

        {homework ? (
          <View style={styles.homeworkContent}>
            <Text style={styles.homeworkTitle} numberOfLines={2}>
              {homework.title}
            </Text>

            <View style={styles.homeworkMeta}>
              <View style={styles.metaItem}>
                <Clock size={12} color={Colors.gray[400]} />
                <Text style={styles.metaText}>
                  Due:{' '}
                  {new Date(homework.due_datetime).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(homework.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusTextColor(homework.status) },
                  ]}
                >
                  {getStatusLabel(homework.status)}
                </Text>
              </View>
            </View>

            {/* Submission Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Users size={14} color={Colors.gray[400]} />
                <Text style={styles.statText}>
                  {homework.submission_stats.total_students}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FileText size={14} color="#3b82f6" />
                <Text style={[styles.statText, styles.statTextBlue]}>
                  {homework.submission_stats.submitted}
                </Text>
              </View>
              <View style={styles.statItem}>
                <CheckCircle size={14} color="#10b981" />
                <Text style={[styles.statText, styles.statTextGreen]}>
                  {homework.submission_stats.reviewed}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onView(homework)}
              >
                <Eye size={14} color={Colors.primary[500]} />
                <Text style={styles.actionBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onEdit(homework)}
              >
                <Pencil size={14} color="#f59e0b" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextAmber]}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onDelete(homework)}
              >
                <Trash2 size={14} color="#ef4444" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextRed]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, styles.submissionsBtn, styles.mt8]}
              onPress={() => onViewSubmissions(homework)}
            >
              <FileText size={14} color="#fff" />
              <Text style={[styles.actionBtnText, styles.actionBtnTextWhite]}>
                Submissions ({homework.submission_stats.submitted})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noHomeworkContent}>
            <Text style={styles.noHomeworkText}>No homework assigned</Text>
            {canAdd && (
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: color.hex }]}
                onPress={() => onCreate(subject.public_id)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add Homework</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}
