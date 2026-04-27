/**
 * EntityActions — Shared View / Edit / Delete icon buttons rendered as a bottom bar
 */

import { Colors } from '@educard/shared';
import { Eye, Edit3, Trash2, RotateCcw } from 'lucide-react-native';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface EntityActionsProps {
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReactivate?: () => void;
}

export function EntityActions({ onView, onEdit, onDelete, onReactivate }: EntityActionsProps) {
  return (
    <View style={s.bar}>
      <TouchableOpacity style={[s.btn, s.viewBtn]} onPress={onView} activeOpacity={0.7}>
        <Eye size={16} color={Colors.info[600]} />
      </TouchableOpacity>
      {onReactivate ? (
        <TouchableOpacity
          style={[s.btn, s.reactivateBtn]}
          onPress={onReactivate}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={Colors.success[600]} />
        </TouchableOpacity>
      ) : (
        <>
          {onEdit && (
            <TouchableOpacity style={[s.btn, s.editBtn]} onPress={onEdit} activeOpacity={0.7}>
              <Edit3 size={16} color={Colors.success[600]} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[s.btn, s.deleteBtn]} onPress={onDelete} activeOpacity={0.7}>
              <Trash2 size={16} color={Colors.error[600]} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    marginTop: 10,
    paddingTop: 10,
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtn: { backgroundColor: Colors.info[50] },
  editBtn: { backgroundColor: Colors.success[50] },
  deleteBtn: { backgroundColor: Colors.error[50] },
  reactivateBtn: { backgroundColor: Colors.success[50] },
});
