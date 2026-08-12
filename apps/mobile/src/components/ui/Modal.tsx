import { Colors } from '@educard/shared';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

export type ModalVariant = 'success' | 'error' | 'warning' | 'info';

interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: ModalVariant;
  actions?: ModalAction[];
  showCloseButton?: boolean;
  children?: React.ReactNode;
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    iconColor: Colors.success[500],
    bgColor: Colors.success[50],
    borderColor: Colors.success[200],
  },
  error: {
    icon: AlertCircle,
    iconColor: Colors.danger[500],
    bgColor: Colors.danger[50],
    borderColor: Colors.danger[200],
  },
  warning: {
    icon: AlertTriangle,
    iconColor: Colors.warning[500],
    bgColor: Colors.warning[50],
    borderColor: Colors.warning[200],
  },
  info: {
    icon: Info,
    iconColor: Colors.primary[500],
    bgColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
};

export function Modal({
  visible,
  onClose,
  title,
  message,
  variant = 'info',
  actions,
  showCloseButton = true,
  children,
}: ModalProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;
  const { width } = useWindowDimensions();
  let maxModalWidth = width - 32;
  if (width >= 900) {
    maxModalWidth = 520;
  } else if (width >= 600) {
    maxModalWidth = 460;
  }
  const modalPadding = width < 360 ? 18 : 24;
  const overlayPadding = width < 360 ? 12 : 24;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingHorizontal: overlayPadding }]}>
        <Pressable style={styles.overlayBackground} onPress={onClose} />
        <Animated.View
          entering={ZoomIn.duration(200)}
          exiting={ZoomOut.duration(150)}
          style={[styles.modalWrapper, { maxWidth: maxModalWidth }]}
        >
          <View
            style={[
              styles.modalContainer,
              { padding: modalPadding, paddingTop: modalPadding + 8 },
            ]}
          >
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={10}
              >
                <X size={22} color={Colors.gray[500]} />
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor,
                },
              ]}
            >
              <IconComponent size={32} color={config.iconColor} />
            </View>

            <Text style={styles.title}>{title}</Text>

            {message && <Text style={styles.message}>{message}</Text>}

            {children}

            {actions && actions.length > 0 && (
              <View style={styles.actionsContainer}>
                {actions.map(action => (
                  <TouchableOpacity
                    key={action.label}
                    style={[
                      styles.actionButton,
                      action.variant === 'primary' && styles.primaryButton,
                      action.variant === 'secondary' && styles.secondaryButton,
                      action.variant === 'danger' && styles.dangerButton,
                      !action.variant && styles.primaryButton,
                    ]}
                    onPress={action.onPress}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        action.variant === 'secondary' &&
                          styles.secondaryButtonText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}

interface AlertOptions {
  title: string;
  message?: string;
  variant?: ModalVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useModal() {
  const [modalState, setModalState] = React.useState<{
    visible: boolean;
    title: string;
    message?: string;
    variant: ModalVariant;
    actions: ModalAction[];
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
    actions: [],
  });

  const showModal = React.useCallback((options: AlertOptions) => {
    const actions: ModalAction[] = [];

    if (options.cancelText) {
      actions.push({
        label: options.cancelText,
        variant: 'secondary',
        onPress: () => {
          setModalState(prev => ({ ...prev, visible: false }));
          options.onCancel?.();
        },
      });
    }

    actions.push({
      label: options.confirmText ?? 'OK',
      variant: 'primary',
      onPress: () => {
        setModalState(prev => ({ ...prev, visible: false }));
        options.onConfirm?.();
      },
    });

    setModalState({
      visible: true,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
      actions,
    });
  }, []);

  const hideModal = React.useCallback(() => {
    setModalState(prev => ({ ...prev, visible: false }));
  }, []);

  const success = React.useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({ title, message, variant: 'success', onConfirm });
    },
    [showModal],
  );

  const error = React.useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({ title, message, variant: 'error', onConfirm });
    },
    [showModal],
  );

  const warning = React.useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({ title, message, variant: 'warning', onConfirm });
    },
    [showModal],
  );

  const info = React.useCallback(
    (title: string, message?: string, onConfirm?: () => void) => {
      showModal({ title, message, variant: 'info', onConfirm });
    },
    [showModal],
  );

  const confirm = React.useCallback(
    (
      title: string,
      message?: string,
      onConfirm?: () => void,
      onCancel?: () => void,
    ) => {
      showModal({
        title,
        message,
        variant: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm,
        onCancel,
      });
    },
    [showModal],
  );

  // A memoised element keeps the Modal's type stable; returning a component
  // factory here remounts the native modal on every host render, which drops
  // keyboard focus and can leave a stale overlay swallowing touches.
  const modalElement = React.useMemo(
    () => (
      <Modal
        visible={modalState.visible}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        actions={modalState.actions}
      />
    ),
    [modalState, hideModal],
  );

  return {
    modalState,
    showModal,
    hideModal,
    success,
    error,
    warning,
    info,
    confirm,
    modalElement,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
  },
  secondaryButton: {
    backgroundColor: Colors.gray[100],
  },
  dangerButton: {
    backgroundColor: Colors.danger[500],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: Colors.gray[700],
  },
});
