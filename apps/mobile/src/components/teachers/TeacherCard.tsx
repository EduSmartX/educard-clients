/**
 * TeacherCard Component
 * Reusable card for displaying teacher info in lists
 */

import { Colors } from '@educard/shared';
import type { Teacher } from '@educard/shared';
import { Eye, Edit3, Trash2, UserCircle, Briefcase } from 'lucide-react-native';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

import { cardStyles, avatarStyles, actionBtnStyles, textStyles } from '@/styles';

interface TeacherCardProps {
  teacher: Teacher;
  onView?: (teacher: Teacher) => void;
  onEdit?: (teacher: Teacher) => void;
  onDelete?: (teacher: Teacher) => void;
}

export function TeacherCard({ teacher, onView, onEdit, onDelete }: TeacherCardProps) {
  return (
    <TouchableOpacity
      style={[cardStyles.card, styles.row]}
      onPress={() => onView?.(teacher)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={avatarStyles.container}>
        {teacher.profile_photo_thumbnail ? (
          <Image source={{ uri: teacher.profile_photo_thumbnail }} style={avatarStyles.medium} />
        ) : (
          <View style={[avatarStyles.medium, avatarStyles.placeholder]}>
            <UserCircle size={32} color={Colors.gray[400]} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={textStyles.title} numberOfLines={1}>
          {teacher.full_name}
        </Text>
        <Text style={textStyles.subtitle}>{teacher.employee_id}</Text>

        {teacher.designation ? (
          <View style={styles.infoRow}>
            <Briefcase size={12} color={Colors.gray[400]} />
            <Text style={textStyles.caption} numberOfLines={1}>
              {teacher.designation}
            </Text>
          </View>
        ) : null}

        {teacher.subjects && teacher.subjects.length > 0 ? (
          <View style={styles.subjectsRow}>
            {teacher.subjects.slice(0, 2).map((subject, idx) => (
              <View key={idx} style={styles.subjectTag}>
                <Text style={textStyles.tag}>{subject.name}</Text>
              </View>
            ))}
            {teacher.subjects.length > 2 && (
              <Text style={styles.moreSubjects}>+{teacher.subjects.length - 2}</Text>
            )}
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View style={actionBtnStyles.container}>
        {onView && (
          <TouchableOpacity
            style={[actionBtnStyles.btn, actionBtnStyles.view]}
            onPress={() => onView(teacher)}
          >
            <Eye size={16} color={Colors.info[500]} />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity
            style={[actionBtnStyles.btn, actionBtnStyles.edit]}
            onPress={() => onEdit(teacher)}
          >
            <Edit3 size={16} color={Colors.success[500]} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[actionBtnStyles.btn, actionBtnStyles.delete]}
            onPress={() => onDelete(teacher)}
          >
            <Trash2 size={16} color={Colors.error[500]} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Component-specific styles only (shared styles imported from @/styles)
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  subjectsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  subjectTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreSubjects: { fontSize: 10, color: Colors.gray[400] },
});
