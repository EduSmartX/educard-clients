/**
 * FormPhotoUpload - Profile photo picker (camera + gallery)
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, X, User } from 'lucide-react-native';

interface FormPhotoUploadProps {
  label?: string;
  imageUri: string | null;
  onImageSelected: (uri: string | null, asset: ImagePicker.ImagePickerAsset | null) => void;
  disabled?: boolean;
  name?: string;
  gender?: string;
}

export function FormPhotoUpload({
  label = 'Profile Photo',
  imageUri,
  onImageSelected,
  disabled,
  name,
  gender,
}: FormPhotoUploadProps) {
  const requestPermissions = async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!camera.granted || !media.granted) {
      Alert.alert(
        'Permission Required',
        'Camera and photo library permissions are needed to upload a photo.'
      );
      return false;
    }
    return true;
  };

  const pickFromCamera = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri, result.assets[0]);
    }
  };

  const pickFromGallery = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri, result.assets[0]);
    }
  };

  const showOptions = () => {
    if (disabled) return;
    if (Platform.OS === 'ios') {
      const opts = imageUri
        ? ['Take Photo', 'Choose from Gallery', 'Remove Photo', 'Cancel']
        : ['Take Photo', 'Choose from Gallery', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: opts,
          cancelButtonIndex: opts.length - 1,
          destructiveButtonIndex: imageUri ? 2 : undefined,
        },
        (idx) => {
          if (idx === 0) pickFromCamera();
          else if (idx === 1) pickFromGallery();
          else if (idx === 2 && imageUri) onImageSelected(null, null);
        }
      );
    } else {
      Alert.alert('Upload Photo', 'Choose an option', [
        { text: 'Camera', onPress: pickFromCamera },
        { text: 'Gallery', onPress: pickFromGallery },
        ...(imageUri
          ? [
              {
                text: 'Remove',
                style: 'destructive' as const,
                onPress: () => onImageSelected(null, null),
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  // Initials fallback
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.photoArea} onPress={showOptions} activeOpacity={0.7}>
        {imageUri ? (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: imageUri }} style={styles.photo} />
            {!disabled && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onImageSelected(null, null)}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            {initials ? (
              <Text style={styles.initials}>{initials}</Text>
            ) : (
              <User size={32} color="#94a3b8" />
            )}
          </View>
        )}
        <View style={styles.actions}>
          <View style={styles.actionBtn}>
            <Camera size={16} color="#7c3aed" />
            <Text style={styles.actionText}>Camera</Text>
          </View>
          <View style={styles.actionBtn}>
            <ImageIcon size={16} color="#7c3aed" />
            <Text style={styles.actionText}>Gallery</Text>
          </View>
        </View>
        <Text style={styles.hint}>Tap to upload photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  photoArea: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
  },
  photoWrapper: { position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#7c3aed' },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 28, fontWeight: '700', color: '#7c3aed' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#7c3aed' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
});
