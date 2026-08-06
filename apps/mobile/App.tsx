import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { ToastProvider } from '@/lib/toast-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { CriticalOperationProvider } from '@/providers/critical-operation-context';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar barStyle="light-content" />
            <ToastProvider>
              <CriticalOperationProvider>
                <ErrorBoundary label="App">
                  <RootNavigator />
                </ErrorBoundary>
              </CriticalOperationProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
