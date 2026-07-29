import { Colors } from '@educard/shared';
import { Pencil, Trash2 } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Holiday } from '@/features/holidays';

import { HOLIDAY_TYPE_CONFIG } from './constants';
import { styles } from './styles';
import { formatDate, getDaysBetween } from './utils';

interface TableItemProps {
  item: Holiday;
  index: number;
  canManage: boolean;
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
}

export function TableItem({ item, index, canManage, onEdit, onDelete }: TableItemProps) {
  const config = HOLIDAY_TYPE_CONFIG[item.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
  const duration = getDaysBetween(item.start_date, item.end_date);

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <View style={[styles.tableCard, { borderLeftColor: config.color }]}>
        <View style={styles.tableCardRow}>
          <View style={[styles.tableIcon, { backgroundColor: config.bg }]}>
            <Text style={{ fontSize: 18 }}>{config.icon}</Text>
          </View>
          <View style={styles.tableCardInfo}>
            <Text style={styles.tableCardTitle}>{item.description}</Text>
            <Text style={styles.tableCardDate}>
              {formatDate(item.start_date)}
              {item.start_date !== item.end_date && ` — ${formatDate(item.end_date)}`}
            </Text>
          </View>
        </View>
        <View style={styles.tableCardFooter}>
          <View style={[styles.upcomingTypeBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.upcomingTypeText, { color: config.color }]}>{config.label}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {duration} {duration === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          {canManage && (
            <>
              <TouchableOpacity onPress={() => onEdit(item)} style={styles.tinyBtn}>
                <Pencil size={14} color="#7c3aed" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)} style={styles.tinyBtn}>
                <Trash2 size={14} color={Colors.danger[400]} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
