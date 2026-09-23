/**
 * FormPhotoUpload - Profile photo picker (camera + gallery)
 */

import { Camera, ImageIcon, X, User } from 'lucide-react-native';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';

interface FormPhotoUploadProps {
  label?: string;
  imageUri: string | null;
  onImageSelected: (uri: string | null, asset: Asset | null) => void;
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
  gender: _gender,
}: FormPhotoUploadProps) {
  const pickFromCamera = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Camera Unavailable',
          'Camera permission is required to take a photo.',
        );
        return;
      }
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        'Camera Unavailable',
        result.errorMessage ?? 'Camera permission is required to take a photo.',
      );
      return;
    }
    const asset = result.assets?.[0];
    if (asset?.uri) onImageSelected(asset.uri, asset);
  };

  const pickFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert(
        'Gallery Unavailable',
        result.errorMessage ??
          'Photo library permission is required to choose a photo.',
      );
      return;
    }
    const asset = result.assets?.[0];
    if (asset?.uri) onImageSelected(asset.uri, asset);
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
        idx => {
          if (idx === 0) void pickFromCamera();
          else if (idx === 1) void pickFromGallery();
          else if (idx === 2 && imageUri) onImageSelected(null, null);
        },
      );
    } else {
      Alert.alert('Upload Photo', 'Choose an option', [
        { text: 'Camera', onPress: () => void pickFromCamera() },
        { text: 'Gallery', onPress: () => void pickFromGallery() },
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
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.photoArea}
        onPress={showOptions}
        activeOpacity={0.7}
      >
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
  photo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#7c3aed',
  },
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
