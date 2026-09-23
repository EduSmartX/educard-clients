import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen({
  title,
  description,
}: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
  },
});
