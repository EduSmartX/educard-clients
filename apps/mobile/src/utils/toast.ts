/**
 * Toast utility — lightweight wrapper around Alert for now.
 * Replace with a proper toast library (react-native-toast-message, etc.) as needed.
 */

import { Alert } from 'react-native';

export function showToast(type: 'success' | 'error' | 'info', message: string): void {
  if (type === 'error') {
    Alert.alert('Error', message);
  }
  // Success/info toasts are silent in the mutation layer.
  // Screens handle their own success feedback (navigate away, refresh, etc.)
}
