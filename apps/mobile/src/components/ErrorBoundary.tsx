/**
 * App-wide error boundary: stops a single screen crash from blanking the whole
 * app (which otherwise forces a close/reopen) and shows the actual error so it
 * can be debugged on-device, including in release builds.
 */

import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Props {
  children: ReactNode;
  /** Optional label shown in the fallback, e.g. the screen name. */
  label?: string;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaces in Metro and `react-native log-android` / logcat.
    console.error(
      '[ErrorBoundary]',
      this.props.label ?? '',
      error,
      info.componentStack,
    );
    this.setState({ componentStack: info.componentStack ?? null });
  }

  handleReset = () => {
    this.setState({ error: null, componentStack: null });
  };

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <AlertTriangle size={40} color="#ef4444" />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          {this.props.label
            ? `${this.props.label} crashed.`
            : 'This screen crashed.'}{' '}
          You can retry without restarting the app.
        </Text>

        <ScrollView
          style={styles.detailBox}
          contentContainerStyle={styles.detailContent}
        >
          <Text style={styles.detailLabel}>Error</Text>
          <Text style={styles.detailText}>{error.toString()}</Text>
          {!!error.stack && (
            <>
              <Text style={styles.detailLabel}>Stack</Text>
              <Text style={styles.detailText}>{error.stack}</Text>
            </>
          )}
          {!!componentStack && (
            <>
              <Text style={styles.detailLabel}>Component tree</Text>
              <Text style={styles.detailText}>{componentStack}</Text>
            </>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.button}
          onPress={this.handleReset}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    justifyContent: 'center',
  },
  iconWrap: { alignSelf: 'center', marginBottom: 12 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  detailBox: {
    maxHeight: 280,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailContent: { padding: 12 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f87171',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
