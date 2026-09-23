/**
 * String constants for Class Groups module
 */

export const CLASS_GROUP_STRINGS = {
  TAB_TITLE: 'Class Groups',
  TAB_DESCRIPTION:
    'Group classes that share the same period structure (e.g., same start/end times)',

  CREATE_DIALOG_TITLE: 'Create Class Group',
  EDIT_DIALOG_TITLE: 'Edit Class Group',
  ADD_CLASS_DIALOG_TITLE: 'Add Class to Group',
  DELETE_DIALOG_TITLE: 'Delete Class Group',

  LABEL_GROUP_NAME: 'Group Name',
  LABEL_DESCRIPTION: 'Description',
  LABEL_DESCRIPTION_HINT: '(optional)',
  LABEL_DISPLAY_ORDER: 'Display Order',
  LABEL_ASSIGNED_CLASSES: 'Assigned Classes',

  PLACEHOLDER_GROUP_NAME: 'e.g., Pre-Primary, Primary, Senior',
  PLACEHOLDER_DESCRIPTION: 'e.g., Classes that end at 3 PM',
  PLACEHOLDER_SELECT_CLASS: 'Select a class',

  BUTTON_NEW_GROUP: 'New Group',
  BUTTON_CREATE_GROUP: 'Create Group',
  BUTTON_CREATE_FIRST_GROUP: 'Create First Group',
  BUTTON_UPDATE: 'Update',
  BUTTON_ADD_CLASS: 'Add Class',
  BUTTON_CANCEL: 'Cancel',
  BUTTON_SAVING: 'Saving...',
  BUTTON_ADDING: 'Adding...',

  EMPTY_TITLE: 'No Class Groups Yet',
  EMPTY_DESCRIPTION:
    'Create a class group (e.g., "Primary", "Senior") and assign classes to it. Classes in the same group share the same period timings.',
  EMPTY_CLASSES: 'No classes assigned yet',
  ALL_CLASSES_ASSIGNED: 'All classes are already assigned to a group.',
} as const;
