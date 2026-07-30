/**
 * QuickCreateFormBase - Shared layout for simple create screens
 * Provides header, form area with KeyboardAwareScrollView, and gradient submit button.
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FormError } from '@/components/forms';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

export interface QuickCreateFormBaseProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  isSaving: boolean;
  apiError: string | null;
  onSubmit: () => void;
  onDismissError: () => void;
  children: React.ReactNode;
}

export function QuickCreateFormBase({
  title,
  subtitle,
  submitLabel,
  isSaving,
  apiError,
  onSubmit,
  onDismissError,
  children,
}: QuickCreateFormBaseProps) {
  const router = useRouter();

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={[...adminGradient]} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{title}</Text>
              <Text style={headerStyles.subtitle}>{subtitle}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={{ flex: 1 }}
      >
        <FormError message={apiError} onDismiss={onDismissError} />

        {children}

        <TouchableOpacity
          onPress={onSubmit}
          disabled={isSaving}
          style={styles.submitBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.submitText}>{submitLabel}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { padding: 16, paddingBottom: 40 },
  submitBtn: { marginTop: 8 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
