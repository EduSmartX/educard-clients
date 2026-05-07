/**
 * Organization Screen
 * Placeholder for organization settings
 */

import { View, Text, StyleSheet } from 'react-native';

export default function OrganizationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Organization Settings</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});