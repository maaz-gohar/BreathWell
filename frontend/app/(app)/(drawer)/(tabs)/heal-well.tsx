import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import HealWellHub from '../heal-well/index';

export default function BreathWellTabScreen() {
  if (typeof HealWellHub !== 'function') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Heal Well</Text>
      </View>
    );
  }
  return <HealWellHub />;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 18,
  },
});
