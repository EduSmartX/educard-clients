/**
 * ListStates — Shared loading / error / empty states for all list screens
 * Eliminates ~40 lines of duplicated JSX per screen.
 */

import { Colors } from '@educard/shared';
import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { stateStyles } from '@/styles';

// ── Loading ──────────────────────────────────────────────────────
interface LoadingStateProps {
  color: string;
  message?: string;
}

export function LoadingState({
  color,
  message = 'Loading...',
}: LoadingStateProps) {
  return (
    <View style={stateStyles.loading}>
      <ActivityIndicator size="large" color={color} />
      <Text style={stateStyles.loadingText}>{message}</Text>
    </View>
  );
}

// ── Error ────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  detail?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = 'Failed to load data',
  detail,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={stateStyles.error}>
      <AlertCircle size={48} color={Colors.error[400]} />
      <Text style={stateStyles.errorText}>{message}</Text>
      {detail ? <Text style={stateStyles.errorSubtext}>{detail}</Text> : null}
      <TouchableOpacity style={stateStyles.retryBtn} onPress={onRetry}>
        <Text style={stateStyles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Empty ────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  message?: string;
  subMessage?: string;
}

export function EmptyState({
  icon,
  message = 'No results found',
  subMessage,
}: EmptyStateProps) {
  return (
    <View style={stateStyles.empty}>
      {icon}
      <Text style={stateStyles.emptyText}>{message}</Text>
      {subMessage ? (
        <Text style={stateStyles.emptySubtext}>{subMessage}</Text>
      ) : null}
    </View>
  );
}

// ── Footer (infinite scroll spinner) ─────────────────────────────
interface ListFooterProps {
  isLoading: boolean;
  color: string;
}

export function ListFooter({ isLoading, color }: ListFooterProps) {
  if (!isLoading) return null;
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingVertical: 16, alignItems: 'center' },
});
