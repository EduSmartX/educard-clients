/**
 * Toast Notification Component
 * Reusable auto-dismissing notification that shows for CRUD operations.
 * - Auto-closes after 5 seconds
 * - Manual close via X button
 * - Supports success, error, warning, info variants
 */

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useEffect, useRef, useCallback } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, { Icon: typeof CheckCircle; color: string }> = {
  success: { Icon: CheckCircle, color: '#16a34a' },
  error: { Icon: AlertCircle, color: '#dc2626' },
  warning: { Icon: AlertTriangle, color: '#d97706' },
  info: { Icon: Info, color: '#2563eb' },
};

const BG_COLORS: Record<ToastType, string> = {
  success: '#f0fdf4',
  error: '#fef2f2',
  warning: '#fffbeb',
  info: '#eff6ff',
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: '#bbf7d0',
  error: '#fecaca',
  warning: '#fde68a',
  info: '#bfdbfe',
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  }, [toast.id, onDismiss, translateY, opacity]);

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [dismiss, opacity, toast.duration, translateY]);

  const { Icon, color } = ICONS[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: BG_COLORS[toast.type],
          borderColor: BORDER_COLORS[toast.type],
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Icon size={20} color={color} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color }]}>{toast.title}</Text>
        {toast.message && <Text style={styles.message}>{toast.message}</Text>}
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={8}>
        <X size={16} color="#64748b" />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    ...Platform.select({
      android: { elevation: 8 },
    }),
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
});
