import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

type CriticalOperationOptions = {
  title?: string;
  description?: string;
};

type CriticalOperationContextValue = {
  isCriticalOperationActive: boolean;
  beginCriticalOperation: (options?: CriticalOperationOptions) => void;
  endCriticalOperation: () => void;
};

const DEFAULT_TITLE = 'Processing request';
const DEFAULT_DESCRIPTION = 'Please wait until the operation completes.';

const CriticalOperationContext = createContext<CriticalOperationContextValue | null>(null);

export function CriticalOperationProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);

  const beginCriticalOperation = useCallback((options?: CriticalOperationOptions) => {
    setTitle(options?.title ?? DEFAULT_TITLE);
    setDescription(options?.description ?? DEFAULT_DESCRIPTION);
    setIsActive(true);
  }, []);

  const endCriticalOperation = useCallback(() => {
    setIsActive(false);
    setTitle(DEFAULT_TITLE);
    setDescription(DEFAULT_DESCRIPTION);
  }, []);

  const value = useMemo(
    () => ({
      isCriticalOperationActive: isActive,
      beginCriticalOperation,
      endCriticalOperation,
    }),
    [isActive, beginCriticalOperation, endCriticalOperation]
  );

  return (
    <CriticalOperationContext.Provider value={value}>
      {children}
      <Modal visible={isActive} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      </Modal>
    </CriticalOperationContext.Provider>
  );
}

export function useCriticalOperation() {
  const context = useContext(CriticalOperationContext);
  if (!context) {
    throw new Error('useCriticalOperation must be used within CriticalOperationProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },
});
