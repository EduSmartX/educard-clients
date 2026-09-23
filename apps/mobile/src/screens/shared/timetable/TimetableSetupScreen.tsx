/**
 * Timetable Setup Screen
 * Manage class groups, time slots, and assign entries
 */

import type { Class, ClassGroup } from '@educard/shared';
import { getRoleGradient, extractApiError } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Users,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormInput, FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import {
  useClassGroups,
  useCreateClassGroup,
  useUpdateClassGroup,
  useDeleteClassGroup,
  useAddClassToGroup,
  useRemoveClassFromGroup,
} from '@/features/timetable';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { st } from './setup-styles';

const adminGradient = getRoleGradient('admin');

export default function TimetableSetupScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Data
  const { data: groups = [], isLoading, refetch } = useClassGroups();
  const { data: classesData } = useClasses({ page_size: 200 });

  // Group form state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClassGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Add class to group state
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Mutations
  const createGroup = useCreateClassGroup();
  const updateGroup = useUpdateClassGroup();
  const deleteGroup = useDeleteClassGroup();
  const addClassMutation = useAddClassToGroup();
  const removeClassMutation = useRemoveClassFromGroup();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Classes not yet assigned to the target group
  const unassignedClasses = useCallback(
    (group: ClassGroup) => {
      const allClasses = classesData?.classes ?? [];
      const assignedIds = new Set(
        (group.classes ?? []).map(c => c.class_public_id),
      );
      return allClasses
        .filter((c: Class) => !assignedIds.has(c.public_id))
        .map((c: Class) => ({
          label: `${c.class_master?.name ?? c.name} - ${c.name}`,
          value: c.public_id,
        }));
    },
    [classesData],
  );

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({
          publicId: editingGroup.public_id,
          data: { name: groupName.trim(), description: groupDesc.trim() },
        });
      } else {
        await createGroup.mutateAsync({
          name: groupName.trim(),
          description: groupDesc.trim(),
        });
      }
      setShowGroupForm(false);
      setEditingGroup(null);
      setGroupName('');
      setGroupDesc('');
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    }
  };

  const handleDeleteGroup = (group: ClassGroup) => {
    Alert.alert(
      'Delete Group',
      `Delete "${group.name}"? This will remove all associated slots.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteGroup.mutateAsync(group.public_id);
              } catch (err) {
                Alert.alert('Error', extractApiError(err));
              }
            })();
          },
        },
      ],
    );
  };

  const handleAddClass = async (groupId: string) => {
    if (!selectedClassId) return;
    try {
      await addClassMutation.mutateAsync({ groupId, classId: selectedClassId });
      setSelectedClassId('');
      setAddingToGroupId(null);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    }
  };

  const handleRemoveClass = (
    groupId: string,
    classId: string,
    className: string,
  ) => {
    Alert.alert('Remove Class', `Remove "${className}" from this group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeClassMutation.mutateAsync({ groupId, classId });
            } catch (err) {
              Alert.alert('Error', extractApiError(err));
            }
          })();
        },
      },
    ]);
  };

  const openEditGroup = (group: ClassGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDesc(group.description ?? '');
    setShowGroupForm(true);
  };

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDesc('');
    setShowGroupForm(true);
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Timetable Setup</Text>
              <Text style={headerStyles.subtitle}>
                Manage class groups & slots
              </Text>
            </View>
            <View style={st.headerActions}>
              <TouchableOpacity
                style={st.headerLabelBtn}
                onPress={() => navigation.navigate('Timetable')}
              >
                <Calendar size={16} color="#fff" />
                <Text style={st.headerLabelText}>Assign Subjects</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.addBtn} onPress={openCreateGroup}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={st.body}
        contentContainerStyle={st.bodyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#7c3aed']}
          />
        }
      >
        {/* Group Form */}
        {showGroupForm && (
          <Animated.View entering={FadeInDown.springify()} style={st.formCard}>
            <Text style={st.formTitle}>
              {editingGroup ? 'Edit Group' : 'New Class Group'}
            </Text>
            <FormInput
              label="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g., Primary Classes"
              required
            />
            <FormInput
              label="Description"
              value={groupDesc}
              onChangeText={setGroupDesc}
              placeholder="Optional description"
              multiline
            />
            <View style={st.formActions}>
              <TouchableOpacity
                style={st.cancelBtn}
                onPress={() => {
                  setShowGroupForm(false);
                  setEditingGroup(null);
                }}
              >
                <Text style={st.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  st.saveBtn,
                  (createGroup.isPending || updateGroup.isPending) &&
                    st.saveBtnDisabled,
                ]}
                onPress={() => void handleSaveGroup()}
                disabled={createGroup.isPending || updateGroup.isPending}
              >
                {createGroup.isPending || updateGroup.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={st.saveText}>
                    {editingGroup ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={st.loading}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        )}
        {!isLoading && groups.length === 0 && !showGroupForm && (
          <View style={st.empty}>
            <Text style={st.emptyIcon}>📦</Text>
            <Text style={st.emptyTitle}>No Class Groups</Text>
            <Text style={st.emptySubtitle}>
              Create class groups to organize your timetable. Groups share the
              same time slot structure.
            </Text>
            <TouchableOpacity
              style={st.createFirstBtn}
              onPress={openCreateGroup}
            >
              <Plus size={16} color="#fff" />
              <Text style={st.createFirstText}>Create First Group</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading &&
          (groups.length > 0 || showGroupForm) &&
          groups.map((group, gIdx) => (
            <Animated.View
              key={group.public_id}
              entering={FadeInDown.delay(gIdx * 80).springify()}
            >
              <View style={st.groupCard}>
                {/* Group Header */}
                <View style={st.groupHeader}>
                  <View style={st.groupIcon}>
                    <Users size={16} color="#7c3aed" />
                  </View>
                  <View style={st.flex1}>
                    <Text style={st.groupName}>{group.name}</Text>
                    {group.description ? (
                      <Text style={st.groupDesc}>{group.description}</Text>
                    ) : null}
                  </View>
                  <View style={st.groupActions}>
                    <TouchableOpacity
                      style={st.iconBtn}
                      onPress={() => openEditGroup(group)}
                    >
                      <Pencil size={16} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={st.iconBtn}
                      onPress={() => handleDeleteGroup(group)}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Classes in group */}
                <View style={st.classesSection}>
                  <Text style={st.classesLabel}>
                    Classes ({(group.classes ?? []).length})
                  </Text>
                  {(group.classes ?? []).map(cls => (
                    <View key={cls.public_id} style={st.classChip}>
                      <Text style={st.classChipText}>
                        {cls.class_master_name} - {cls.section_name}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleRemoveClass(
                            group.public_id,
                            cls.class_public_id,
                            cls.class_name,
                          )
                        }
                      >
                        <X size={14} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add class */}
                  {addingToGroupId === group.public_id ? (
                    <View style={st.addClassRow}>
                      <View style={st.flex1}>
                        <FormDropdown
                          label=""
                          value={selectedClassId}
                          onChange={setSelectedClassId}
                          options={unassignedClasses(group)}
                          placeholder="Select a class"
                        />
                      </View>
                      <TouchableOpacity
                        style={st.addClassConfirm}
                        onPress={() => void handleAddClass(group.public_id)}
                        disabled={!selectedClassId}
                      >
                        <Check size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={st.addClassCancel}
                        onPress={() => {
                          setAddingToGroupId(null);
                          setSelectedClassId('');
                        }}
                      >
                        <X size={16} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={st.bottomActions}>
                      <TouchableOpacity
                        style={st.addClassBtn}
                        onPress={() => setAddingToGroupId(group.public_id)}
                      >
                        <Plus size={14} color="#7c3aed" />
                        <Text style={st.addClassText}>Add Class</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={st.timeslotsBtn}
                        onPress={() =>
                          navigation.navigate('TimetableSlotsEditor', {
                            groupId: group.public_id,
                            groupName: encodeURIComponent(group.name),
                          })
                        }
                      >
                        <Clock size={14} color="#0d9488" />
                        <Text style={st.timeslotsText}>Timeslots</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
      </ScrollView>
    </View>
  );
}
